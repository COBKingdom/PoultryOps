"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { createFarmAndTrial } from "@/lib/onboarding";
import { refreshProfile } from "@/contexts/AuthContext";
import { PLANS, PLAN_FEATURES, PLAN_ORDER, ANNUAL_SAVINGS } from "@/lib/plans";
import { Check } from "lucide-react";

type PlanKey = "solo" | "team" | "business";

export default function OnboardingForm() {
  const router = useRouter();

  const { user } = useAuth();

  const [farmName, setFarmName] = useState("");
  const [farmType, setFarmType] = useState("Poultry");
  const [currency, setCurrency] = useState("NGN");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!selectedPlan) {
        throw new Error("Please select a trial plan");
      }

      setLoading(true);
      setMessage("");

      await createFarmAndTrial({
        userId: user.id,
        farmName,
        farmType,
        currency,
        selectedPlan,
      });

      // Refresh profile to get updated role and farm_id
      await refreshProfile();

      // Small delay to ensure context has updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Failed to create farm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        w-full
        max-w-5xl
        bg-white
        rounded-3xl
        border
        border-slate-200
        p-8
        shadow-sm
      "
    >
      <h1 className="text-3xl font-bold">
        Welcome to PoultryOps
      </h1>

      <p className="text-slate-500 mt-2">
        Let's set up your farm and start your free trial.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8 mt-8">
        {/* Farm Details Section */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Farm Details
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Farm Name
            </label>

            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full border rounded-xl p-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Farm Type
            </label>

            <select
              value={farmType}
              onChange={(e) => setFarmType(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option>Poultry</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Currency
            </label>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="CAD">Canadian Dollar (C$)</option>
              <option value="AUD">Australian Dollar (A$)</option>
              <option value="GHS">Ghanaian Cedi (GH₵)</option>
              <option value="KES">Kenyan Shilling (KSh)</option>
              <option value="ZAR">South African Rand (R)</option>
            </select>
          </div>
        </div>

        {/* Trial Plan Selection Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Choose Your Trial Plan
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a plan to start your 14-day free trial. You can upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_ORDER.map((planKey) => {
              const plan = PLANS[planKey];
              const isSelected = selectedPlan === planKey;

              return (
                <div
                  key={planKey}
                  onClick={() => setSelectedPlan(planKey)}
                  className={`
                    relative flex flex-col
                    border-2 rounded-2xl
                    p-6
                    cursor-pointer
                    transition-all
                    hover:shadow-md
                    ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Monthly Price */}
                    <div className="text-center pb-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-1">Monthly</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          ₦{plan.monthly.toLocaleString("en-NG")}
                        </span>
                        <span className="text-sm font-medium text-gray-500">/mo</span>
                      </div>
                    </div>

                    {/* Annual Price */}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 mb-1">Annual</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          ₦{plan.annual.toLocaleString("en-NG")}
                        </span>
                        <span className="text-sm font-medium text-gray-500">/yr</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center bg-green-50 text-green-600 rounded-full px-2 py-0.5 text-xs font-medium">
                          {ANNUAL_SAVINGS[planKey]}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-semibold tracking-wider uppercase text-gray-900">
                        Features
                      </p>
                      <ul className="space-y-2">
                        {PLAN_FEATURES[planKey].map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!selectedPlan && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Please select a trial plan to continue
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedPlan}
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            text-white
            rounded-xl
            p-4
            font-semibold
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          {loading ? "Creating Farm..." : "Start Free Trial"}
        </button>

        {message && (
          <p className="text-red-500 text-sm">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}