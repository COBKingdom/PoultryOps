import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const transactionId = body.transaction_id;

    if (!transactionId) {
      return NextResponse.json(
        {
          error: "Transaction ID missing",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate processing

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
        {
          error: "Payment verification failed",
        },
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
          next_billing_date:
            nextBillingDate.toISOString(),
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

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Verification failed",
      },
      {
        status: 500,
      }
    );
  }
}