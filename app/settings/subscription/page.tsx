"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

export default function SubscriptionPage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  if (loading) {
    return <div>Loading...</div>;
  }

  const currentPlan =
    data?.subscription?.plan;

  const plans = [
    {
      name: "Solo",
      price: "₦10,000/month",
      users: "1 User",
    },
    {
      name: "Team",
      price: "₦15,000/month",
      users: "3 Users",
    },
    {
      name: "Business",
      price: "₦20,000/month",
      users: "6 Users",
    },
  ];

  return (
    <OwnerOnly>
      <AppShell
        email={user?.email}
        farmName={data?.farm?.name}
      >
        <div className="p-6 space-y-6">

          <h1 className="text-4xl font-bold">
            Subscription Plans
          </h1>

          <div className="grid md:grid-cols-3 gap-6">

            {plans.map((plan) => (
              <div
                key={plan.name}
                className="bg-white rounded-3xl border p-6"
              >
                <h2 className="text-2xl font-bold">
                  {plan.name}
                </h2>

                <p className="mt-2 text-lg">
                  {plan.price}
                </p>

                <p className="mt-2 text-slate-500">
                  {plan.users}
                </p>

                {currentPlan?.toLowerCase() ===
                plan.name.toLowerCase() ? (
                  <button
                    disabled
                    className="mt-6 w-full bg-green-600 text-white rounded-xl py-3"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    className="mt-6 w-full bg-blue-600 text-white rounded-xl py-3"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            ))}

          </div>

        </div>
      </AppShell>
    </OwnerOnly>
  );
}