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
      if (!window.FlutterwaveCheckout) {
        alert("Payment system is still loading. Please try again.");
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
          process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,

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
          description: `${selectedPlan.name} Plan`,
          logo: "",
        },

        meta: {
          farm_id: profile.farm_id,
          plan,
          billing_cycle: billingCycle,
        },

        callback: async (response: any) => {
          try {
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
          } catch (error) {
            console.error(error);
            alert(
              "Verification failed"
            );
          } finally {
            setLoading(false);
          }
        },

        onclose: () => {},
      });
    } catch (error) {
      console.error(error);
      alert(
        "Unable to launch payment window"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Subscription Management
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your PoultryOps subscription,
          renew your plan and unlock additional users.
        </p>
      </div>

      {/* Current Plan */}

      <div className="bg-white border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Current Subscription
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <div>
            <p className="text-sm text-gray-500">
              Current Plan
            </p>
            <p className="font-semibold">
              {profile?.role === "owner"
                ? "Trial"
                : "Active"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>
            <p className="font-semibold text-green-600">
              Active
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Billing
            </p>
            <p className="font-semibold">
              Trial Period
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Users
            </p>
            <p className="font-semibold">
              Based on selected plan
            </p>
          </div>

        </div>
      </div>

      {/* Plans */}

      <div className="grid md:grid-cols-3 gap-6">

        {/* SOLO */}

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">
            Solo
          </h2>

          <p className="text-gray-600 mb-4">
            Perfect for small poultry farms.
          </p>

          <div className="mb-6">
            <p className="font-medium">
              1 User
            </p>
          </div>

          <div className="space-y-3">

            <button
              onClick={() =>
                payNow(
                  "solo",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
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
              className="w-full border py-3 rounded-lg"
            >
              ₦108,000 / Year
            </button>

          </div>
        </div>

        {/* TEAM */}

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">
            Team
          </h2>

          <p className="text-gray-600 mb-4">
            Ideal for growing poultry businesses.
          </p>

          <div className="mb-6">
            <p className="font-medium">
              3 Users
            </p>
          </div>

          <div className="space-y-3">

            <button
              onClick={() =>
                payNow(
                  "team",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
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
              className="w-full border py-3 rounded-lg"
            >
              ₦162,000 / Year
            </button>

          </div>
        </div>

        {/* BUSINESS */}

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">
            Business
          </h2>

          <p className="text-gray-600 mb-4">
            For larger poultry operations.
          </p>

          <div className="mb-6">
            <p className="font-medium">
              6 Users
            </p>
          </div>

          <div className="space-y-3">

            <button
              onClick={() =>
                payNow(
                  "business",
                  "monthly"
                )
              }
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
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
              className="w-full border py-3 rounded-lg"
            >
              ₦216,000 / Year
            </button>

          </div>
        </div>

      </div>

      {loading && (
        <div className="mt-6 text-center">
          Verifying payment...
        </div>
      )}
    </div>
  );
}