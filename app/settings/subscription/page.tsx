"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS } from "@/lib/flutterwave";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export default function SubscriptionPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);

  const payNow = (
    plan: "solo" | "team" | "business",
    billingCycle: "monthly" | "annual"
  ) => {
    if (!profile) return;

    const selectedPlan = PLANS[plan];

    const amount =
      billingCycle === "annual"
        ? selectedPlan.annual
        : selectedPlan.monthly;

    window.FlutterwaveCheckout({
      public_key:
        process.env
          .NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,

      tx_ref:
        "POULTRYOPS-" +
        Date.now(),

      amount,

      currency: "NGN",

      payment_options:
        "card,banktransfer,ussd",

      customer: {
        email:
          profile.email ||
          "customer@poultryops.com",

        name:
          profile.full_name ||
          "Farm Owner",
      },

      customizations: {
        title: "PoultryOps Subscription",
        description:
          `${selectedPlan.name} Plan`,
      },

      meta: {
        farm_id: profile.farm_id,
        plan,
        billing_cycle: billingCycle,
      },

      callback: async (
        response: any
      ) => {
        setLoading(true);

        const verify = await fetch(
          "/api/payments/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              transaction_id:
                response.transaction_id,
            }),
          }
        );

        const result =
          await verify.json();

        setLoading(false);

        if (result.success) {
          alert(
            "Subscription activated successfully"
          );

          window.location.reload();
        } else {
          alert(
            "Payment verification failed"
          );
        }
      },

      onclose: () => {},
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-8">
        Subscription Plans
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold">
            Solo
          </h2>

          <p>1 User</p>

          <div className="mt-4">
            <button
              onClick={() =>
                payNow(
                  "solo",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white p-3 rounded mb-2"
            >
              ₦10,000 / Month
            </button>

            <button
              onClick={() =>
                payNow(
                  "solo",
                  "annual"
                )
              }
              className="w-full border p-3 rounded"
            >
              ₦108,000 / Year
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold">
            Team
          </h2>

          <p>3 Users</p>

          <div className="mt-4">
            <button
              onClick={() =>
                payNow(
                  "team",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white p-3 rounded mb-2"
            >
              ₦15,000 / Month
            </button>

            <button
              onClick={() =>
                payNow(
                  "team",
                  "annual"
                )
              }
              className="w-full border p-3 rounded"
            >
              ₦162,000 / Year
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold">
            Business
          </h2>

          <p>6 Users</p>

          <div className="mt-4">
            <button
              onClick={() =>
                payNow(
                  "business",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white p-3 rounded mb-2"
            >
              ₦20,000 / Month
            </button>

            <button
              onClick={() =>
                payNow(
                  "business",
                  "annual"
                )
              }
              className="w-full border p-3 rounded"
            >
              ₦216,000 / Year
            </button>
          </div>
        </div>

      </div>

      {loading && (
        <div className="mt-6">
          Verifying payment...
        </div>
      )}
    </div>
  );
}