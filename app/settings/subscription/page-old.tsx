"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS } from "@/lib/flutterwave";
import { getSubscription } from "@/lib/subscription";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

type SubscriptionData = {
  plan: string;
  status: string;
  billing_cycle: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
};

export default function SubscriptionPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        if (!profile?.farm_id) return;

        const data = await getSubscription(
          profile.farm_id
        );

        setSubscription(data);
      } catch (error) {
        console.error(
          "Error loading subscription:",
          error
        );
      }
    }

    loadSubscription();
  }, [profile]);

  const getUserLimit = (
    plan: string | undefined
  ) => {
    switch (
      (plan || "").toLowerCase()
    ) {
      case "solo":
        return 1;

      case "team":
        return 3;

      case "business":
        return 6;

      default:
        return 1;
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.trial_end)
      return 0;

    const today = new Date();

    const trialEnd = new Date(
      subscription.trial_end
    );

    const diff =
      trialEnd.getTime() -
      today.getTime();

    return Math.max(
      0,
      Math.ceil(
        diff /
          (1000 * 60 * 60 * 24)
      )
    );
  };

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString();
  };

  const payNow = async (
    plan:
      | "solo"
      | "team"
      | "business",
    billingCycle:
      | "monthly"
      | "annual"
  ) => {
    try {
      if (
        !window.FlutterwaveCheckout
      ) {
        alert(
          "Payment system is still loading. Please try again."
        );
        return;
      }

      if (!profile) {
        alert(
          "Profile not loaded"
        );
        return;
      }

      const selectedPlan =
        PLANS[plan];

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
          title:
            "PoultryOps Subscription",
          description:
            `${selectedPlan.name} Plan`,
        },

        meta: {
          farm_id:
            profile.farm_id,
          plan,
          billing_cycle:
            billingCycle,
        },

        callback:
          async (
            response: any
          ) => {
            try {
              setLoading(true);

              const verify =
                await fetch(
                  "/api/payments/verify",
                  {
                    method:
                      "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify(
                      {
                        transaction_id:
                          response.transaction_id,
                      }
                    ),
                  }
                );

              const result =
                await verify.json();

              if (
                result.success
              ) {
                alert(
                  "Subscription activated successfully"
                );

                window.location.reload();
              } else {
                alert(
                  "Payment verification failed"
                );
              }
            } catch (
              error
            ) {
              console.error(
                error
              );

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

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Subscription Management
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your plan,
          billing and team
          access.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">
          Current Subscription
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div>
            <p className="text-sm text-gray-500">
              Current Plan
            </p>

            <p className="font-bold text-lg">
              {subscription?.plan ||
                "Trial"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <p className="font-bold text-lg">
              {subscription?.status ||
                "trial"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Billing Cycle
            </p>

            <p className="font-bold text-lg">
              {subscription?.billing_cycle ||
                "Trial"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Trial Days Left
            </p>

            <p className="font-bold text-lg">
              {getDaysRemaining()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Next Billing Date
            </p>

            <p className="font-bold text-lg">
              {formatDate(
                subscription?.next_billing_date ||
                  null
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              User Limit
            </p>

            <p className="font-bold text-lg">
              {getUserLimit(
                subscription?.plan
              )}
            </p>
          </div>

        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <PlanCard
          title="Solo"
          users="1 User"
          monthly="₦10,000 / Month"
          annual="₦108,000 / Year"
          onMonthly={() =>
            payNow(
              "solo",
              "monthly"
            )
          }
          onAnnual={() =>
            payNow(
              "solo",
              "annual"
            )
          }
        />

        <PlanCard
          title="Team"
          users="3 Users"
          monthly="₦15,000 / Month"
          annual="₦162,000 / Year"
          onMonthly={() =>
            payNow(
              "team",
              "monthly"
            )
          }
          onAnnual={() =>
            payNow(
              "team",
              "annual"
            )
          }
        />

        <PlanCard
          title="Business"
          users="6 Users"
          monthly="₦20,000 / Month"
          annual="₦216,000 / Year"
          onMonthly={() =>
            payNow(
              "business",
              "monthly"
            )
          }
          onAnnual={() =>
            payNow(
              "business",
              "annual"
            )
          }
        />

      </div>

      {loading && (
        <div className="mt-6 text-center">
          Verifying payment...
        </div>
      )}
    </div>
  );
}

function PlanCard({
  title,
  users,
  monthly,
  annual,
  onMonthly,
  onAnnual,
}: {
  title: string;
  users: string;
  monthly: string;
  annual: string;
  onMonthly: () => void;
  onAnnual: () => void;
}) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-2">
        {title}
      </h2>

      <p className="text-gray-500 mb-4">
        {users}
      </p>

      <div className="space-y-3">
        <button
          onClick={onMonthly}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {monthly}
        </button>

        <button
          onClick={onAnnual}
          className="w-full border py-3 rounded-lg"
        >
          {annual}
        </button>
      </div>
    </div>
  );
}