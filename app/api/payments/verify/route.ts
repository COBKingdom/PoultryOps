import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
// BEGIN TrueOps Email Framework
import {
  sendPaymentReceivedEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionRenewedEmail,
} from "@/lib/email-service";
// END TrueOps Email Framework

// =====================================================================
// Commission generation
//
// Connects successful payments to the EXISTING commission tables
// (pogp_commissions / vend_commissions). No new tables, no triggers,
// no portal/UI changes. Rates below are the authoritative rules:
//
// Direct POGP:
//   - first successful MONTHLY payment ....... 50%
//   - subsequent monthly ...................... 10%
//   - ALL annual payments (first and renewal)  10%  (never 50%)
//
// VEND:
//   - first successful payment ............... flat 5,000 NGN (one-time)
//   - subsequent .............................. 0 NGN
//
// POGP who recruited the VEND (network override):
//   - first payment ........................... 0 NGN
//   - subsequent payments ..................... 5%  (MUST stay 5%)
// =====================================================================

// Direct POGP first-month commission rate (MONTHLY billing only).
const DIRECT_POGP_FIRST_MONTH_RATE = 0.5;

// Direct POGP recurring rate (monthly renewals and all annual payments).
const DIRECT_POGP_RECURRING_RATE = 0.1;

// POGP network override on VEND-referred farms. MUST REMAIN 5%.
const VEND_NETWORK_POGP_RATE = 0.05;

// VEND one-time commission after the referred farm's first payment.
const VEND_FIRST_COMMISSION_AMOUNT = 5000;

/**
 * Idempotently records a POGP commission. Duplicate protection is the
 * existing UNIQUE(payment_id, pogp_id, commission_type) index; the
 * existence check here only avoids noisy unique-violation errors.
 * Returns an error message on failure or null on success.
 */
async function insertPogpCommission(input: {
  pogpId: string;
  farmId: string;
  subscriptionId: string | null;
  paymentId: string;
  commissionType: string;
  amount: number;
  notes: string | null;
}): Promise<string | null> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("pogp_commissions")
    .select("id")
    .eq("payment_id", input.paymentId)
    .eq("pogp_id", input.pogpId)
    .eq("commission_type", input.commissionType)
    .maybeSingle();

  if (existingError) return existingError.message;
  if (existing) return null;

  const { error } = await supabaseAdmin
    .from("pogp_commissions")
    .insert({
      pogp_id: input.pogpId,
      farm_id: input.farmId,
      subscription_id: input.subscriptionId,
      payment_id: input.paymentId,
      commission_type: input.commissionType,
      amount: input.amount,
      status: "earned",
      earned_at: new Date().toISOString(),
      paid_at: null,
      notes: input.notes,
    });

  return error?.message ?? null;
}

/**
 * Idempotently records a VEND commission (existing portals render
 * anything other than "paid" as pending). Duplicate protection is the
 * existing UNIQUE(payment_id, vend_id, commission_type) index.
 */
async function insertVendCommission(input: {
  vendId: string;
  farmId: string;
  subscriptionId: string | null;
  paymentId: string;
  commissionType: string;
  amount: number;
  notes: string | null;
}): Promise<string | null> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("vend_commissions")
    .select("id")
    .eq("payment_id", input.paymentId)
    .eq("vend_id", input.vendId)
    .eq("commission_type", input.commissionType)
    .maybeSingle();

  if (existingError) return existingError.message;
  if (existing) return null;

  const { error } = await supabaseAdmin
    .from("vend_commissions")
    .insert({
      vend_id: input.vendId,
      farm_id: input.farmId,
      subscription_id: input.subscriptionId,
      payment_id: input.paymentId,
      commission_type: input.commissionType,
      amount: input.amount,
      status: "pending",
      earned_at: new Date().toISOString(),
      paid_at: null,
      notes: input.notes,
    });

  return error?.message ?? null;
}

/**
 * Generates the commission records owed for a successful payment.
 * Runs only after the payment row exists. No-op when the farm has no
 * POGP or VEND attribution. Idempotent and safe to re-run.
 */
async function ensureCommissionsForPayment(input: {
  paymentId: string;
  farmId: string;
  amountPaid: number;
  billingCycle: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { paymentId, farmId, amountPaid, billingCycle } = input;

    // One subscription row exists per farm.
    let subscriptionId: string | null = null;
    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("farm_id", farmId)
        .maybeSingle();

    if (subscriptionError) {
      return {
        success: false,
        error: `subscription lookup failed: ${subscriptionError.message}`,
      };
    }
    subscriptionId = subscription?.id ?? null;

    // First successful payment or a subsequent one?
    const { count, error: countError } = await supabaseAdmin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .eq("status", "successful");

    if (countError) {
      return {
        success: false,
        error: `successful payment count failed: ${countError.message}`,
      };
    }
    const isFirstPayment = (count ?? 0) === 1;

    // ------------------------------------------------------------
    // VEND attribution takes precedence over a direct POGP referral.
    // ------------------------------------------------------------
    const { data: vendAttribution, error: vendAttrError } =
      await supabaseAdmin
        .from("vend_attributions")
        .select("vend_id")
        .eq("farm_id", farmId)
        .maybeSingle();

    if (vendAttrError) {
      return {
        success: false,
        error: `vend attribution lookup failed: ${vendAttrError.message}`,
      };
    }

    if (vendAttribution) {
      const { data: vend, error: vendError } = await supabaseAdmin
        .from("vend_partners")
        .select("id, vend_code, recruited_by_pogp_id")
        .eq("id", vendAttribution.vend_id)
        .maybeSingle();

      if (vendError) {
        return {
          success: false,
          error: `vend partner lookup failed: ${vendError.message}`,
        };
      }
      if (!vend) {
        return {
          success: false,
          error: `vend partner ${vendAttribution.vend_id} not found`,
        };
      }

      // VEND: flat 5,000 NGN one-time on the first successful payment.
      if (isFirstPayment) {
        const result = await insertVendCommission({
          vendId: vend.id,
          farmId,
          subscriptionId,
          paymentId,
          commissionType: "new_customer",
          amount: VEND_FIRST_COMMISSION_AMOUNT,
          notes: null,
        });

        if (result) {
          return {
            success: false,
            error: `vend commission insert failed: ${result}`,
          };
        }
      }

      // POGP who recruited this VEND: 5% recurring from the second
      // successful payment onward (first payment = 0, no row created).
      if (vend.recruited_by_pogp_id && !isFirstPayment) {
        const result = await insertPogpCommission({
          pogpId: vend.recruited_by_pogp_id,
          farmId,
          subscriptionId,
          paymentId,
          commissionType: "network_renewal",
          amount: Math.round(amountPaid * VEND_NETWORK_POGP_RATE),
          // The Network Earnings UI locates records via the referral code.
          notes: `Referral code: ${vend.vend_code}`,
        });

        if (result) {
          return {
            success: false,
            error: `pogp network commission insert failed: ${result}`,
          };
        }
      }

      return { success: true };
    }

// ------------------------------------------------------------
    // Direct POGP referral.
    // ------------------------------------------------------------
    const { data: pogpAttribution, error: pogpAttrError } =
      await supabaseAdmin
        .from("pogp_attributions")
        .select("pogp_id")
        .eq("farm_id", farmId)
        .maybeSingle();

    if (pogpAttrError) {
      return {
        success: false,
        error: `pogp attribution lookup failed: ${pogpAttrError.message}`,
      };
    }

    // No POGP or VEND attribution means no commission is owed.
    if (!pogpAttribution) {
      return { success: true };
    }

    const isAnnual = billingCycle === "annual";

    // Billing cycle takes precedence: annual payments are NEVER 50%,
    // even on the first annual payment.
    const rate = isAnnual
      ? DIRECT_POGP_RECURRING_RATE
      : isFirstPayment
        ? DIRECT_POGP_FIRST_MONTH_RATE
        : DIRECT_POGP_RECURRING_RATE;

    const commissionType =
      isAnnual || !isFirstPayment ? "renewal" : "new_customer";

    const result = await insertPogpCommission({
      pogpId: pogpAttribution.pogp_id,
      farmId,
      subscriptionId,
      paymentId,
      commissionType,
      amount: Math.round(amountPaid * rate),
      notes: null,
    });

    if (result) {
      return {
        success: false,
        error: `pogp commission insert failed: ${result}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const transactionId = body.transaction_id;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID missing" },
        { status: 400 }
      );
    }

    const {
      data: existingPayment,
      error: existingError,
    } = await supabaseAdmin
      .from("payments")
      .select("id, farm_id, amount_paid, billing_cycle")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingPayment) {
      // Reconciliation: a prior run may have recorded the payment but
      // failed to generate commissions. Finish the job idempotently
      // (the existing unique indexes prevent duplicates). The
      // transaction_id idempotency check itself is unchanged.
      const commissionResult = await ensureCommissionsForPayment({
        paymentId: existingPayment.id,
        farmId: existingPayment.farm_id,
        amountPaid: Number(existingPayment.amount_paid || 0),
        billingCycle: String(existingPayment.billing_cycle || "monthly"),
      });

      if (!commissionResult.success) {
        console.error(
          "[commission] reconciliation for existing payment failed:",
          commissionResult.error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Payment already processed, but commission reconciliation failed. Please retry.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (
      verifyData.status !== "success" ||
      verifyData.data.status !== "successful"
    ) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const metadata = verifyData.data.meta;

    const farmId = metadata.farm_id;
    const plan = metadata.plan;
    const billingCycle = metadata.billing_cycle;
    const amountPaid = verifyData.data.amount;
    const paymentReference = verifyData.data.tx_ref;

    const nextBillingDate = new Date();

    if (billingCycle === "annual") {
      nextBillingDate.setFullYear(
        nextBillingDate.getFullYear() + 1
      );
    } else {
      nextBillingDate.setMonth(
        nextBillingDate.getMonth() + 1
      );
    }

    // BEGIN TrueOps Email Framework
    const { data: preUpdateSub } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("farm_id", farmId)
      .single();
      

    const previousStatus = preUpdateSub?.status ?? null;
    // END TrueOps Email Framework

    const { error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          billing_cycle: billingCycle,
          payment_reference: paymentReference,
          transaction_id: transactionId,
          amount_paid: amountPaid,
          next_billing_date: nextBillingDate.toISOString(),
        })
        .eq("farm_id", farmId);

    if (subscriptionError) {
      throw subscriptionError;
    }

    const { data: insertedPayment, error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .insert({
          farm_id: farmId,
          plan,
          billing_cycle: billingCycle,
          amount_paid: amountPaid,
          transaction_id: transactionId,
          payment_reference: paymentReference,
          status: "successful",
        })
        .select("id")
        .single();

    if (paymentError) {
      throw paymentError;
    }

    const paymentId = insertedPayment?.id;

    if (!paymentId) {
      throw new Error("Payment was inserted without an id");
    }

    // BEGIN TrueOps Email Framework
    void (async () => {
      try {
        const { data: farm } = await supabaseAdmin
          .from("farms")
          .select("name, owner_id")
          .eq("id", farmId)
          .single();

        if (!farm?.owner_id) {
          console.warn(
            "[email] payment emails skipped: farm not found or missing owner_id",
            { farmId }
          );
          return;
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", farm.owner_id)
          .single();

        if (!profile?.email) {
          console.warn(
            "[email] payment emails skipped: owner profile missing email",
            { farmId, ownerId: farm.owner_id }
          );
          return;
        }

        let isActivation: boolean;

        if (previousStatus !== null) {
          isActivation = previousStatus === "trial";
        } else {
          const { count } = await supabaseAdmin
            .from("payments")
            .select("*", { count: "exact", head: true })
            .eq("farm_id", farmId)
            .eq("status", "successful");

          isActivation = count === 1;
        }

        await Promise.allSettled([
          sendPaymentReceivedEmail(
            farm.owner_id,
            profile.email,
            farm.name,
            paymentReference
          ),
          isActivation
            ? sendSubscriptionActivatedEmail(
                farm.owner_id,
                profile.email,
                farm.name,
                plan
              )
            : sendSubscriptionRenewedEmail(
                farm.owner_id,
                profile.email,
                farm.name,
                plan,
                nextBillingDate.toISOString()
              ),
        ]);
      } catch (err) {
        console.error("[email] payment emails failed:", err);
      }
    })();
    // END TrueOps Email Framework

    // ----------------------------------------------------------
    // Commission generation
    //
    // Runs ONLY after the successful payment has been inserted.
    // Writes into the existing pogp_commissions / vend_commissions
    // tables using the formats the existing portals already render.
    // If this fails the payment stays recorded and the caller can
    // safely retry (commission insertion is idempotent).
    // ----------------------------------------------------------
    const commissionResult = await ensureCommissionsForPayment({
      paymentId,
      farmId,
      amountPaid,
      billingCycle,
    });

    if (!commissionResult.success) {
      console.error(
        "[commission] payment succeeded but commission generation failed:",
        commissionResult.error,
        { paymentId, farmId, transactionId }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment recorded, but commission generation failed. Please retry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}