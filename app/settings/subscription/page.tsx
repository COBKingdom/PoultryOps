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

  const payNow = async (
    plan: "solo" | "team" | "business",
    billingCycle: "monthly" | "annual"
  ) => {
    try {
      console.log("Button clicked");

      console.log(
        "Flutterwave object:",
        window.FlutterwaveCheckout
      );

      console.log(
        "Public key:",
        process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
      );

      if (!window.FlutterwaveCheckout) {
        alert(
          "Flutterwave script not loaded. Check app/layout.tsx"
        );
        return;
      }

      if (!profile) {
        alert("Profile not loaded");
        return;
      }

      const selectedPlan = PLANS[plan];

      const amount =
        billingCycle === "annual"
          ? selectedPlan.annual
          : selectedPlan.monthly;

      window.FlutterwaveCheckout({
        public_key:
          process.env
            .NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,

        tx_ref: `POULTRYOPS-${Date.now()}`,

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

          try {
            const verify =
              await fetch(
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
          } catch (err) {
            console.error(err);
            alert(
              "Verification error"
            );
          }

          setLoading(false);
        },

        onclose: () => {
          console.log(
            "Flutterwave popup closed"
          );
        },
      });
    } catch (err) {
      console.error(err);
      alert(
        "Check browser console for error"
      );
    }
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

          <p className="mt-2">
            ₦10,000/month
          </p>

          <p>
            ₦108,000/year
          </p>

          <p className="mt-2">
            1 User
          </p>

          <button
            onClick={() =>
              payNow(
                "solo",
                "monthly"
              )
            }
            className="w-full bg-blue-600 text-white p-3 rounded mt-6"
          >
            Choose Solo
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold">
            Team
          </h2>

          <p className="mt-2">
            ₦15,000/month
          </p>

          <p>
            ₦162,000/year
          </p>

          <p className="mt-2">
            3 Users
          </p>

          <button
            onClick={() =>
              payNow(
                "team",
                "monthly"
              )
            }
            className="w-full bg-blue-600 text-white p-3 rounded mt-6"
          >
            Choose Team
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold">
            Business
          </h2>

          <p className="mt-2">
            ₦20,000/month
          </p>

          <p>
            ₦216,000/year
          </p>

          <p className="mt-2">
            6 Users
          </p>

          <button
            onClick={() =>
              payNow(
                "business",
                "monthly"
              )
            }
            className="w-full bg-blue-600 text-white p-3 rounded mt-6"
          >
            Choose Business
          </button>
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