import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan,
        billing_cycle: billingCycle,
        status: "active",
        payment_reference: paymentReference,
        transaction_id: transactionId,
        amount_paid: amountPaid,
        next_billing_date:
          nextBillingDate.toISOString(),
      })
      .eq("farm_id", farmId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}