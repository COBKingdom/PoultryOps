import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
// BEGIN TrueOps Email Framework
import {
  sendPaymentReceivedEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionRenewedEmail,
} from "@/lib/email-service";
// END TrueOps Email Framework

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
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingPayment) {
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

    const { error: paymentError } =
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
        });

    if (paymentError) {
      throw paymentError;
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}