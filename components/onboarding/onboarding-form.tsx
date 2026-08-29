"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

import {
  createFarmAndTrial,
  FarmAlreadyExistsError,
} from "@/lib/onboarding";

import {
  PLANS,
  PLAN_FEATURES,
  PLAN_ORDER,
  ANNUAL_SAVINGS,
} from "@/lib/plans";

import { Check } from "lucide-react";

type PlanKey =
  | "solo"
  | "team"
  | "business";

export default function OnboardingForm() {
  const router = useRouter();

  const {
    user,
    refreshProfile,
  } = useAuth();

  // =============================================================
  // Form State
  // =============================================================

  const [fullName, setFullName] =
    useState("");

  const [farmName, setFarmName] =
    useState("");

  const [farmType, setFarmType] =
    useState("Poultry");

  const [currency, setCurrency] =
    useState("NGN");

  const [selectedPlan, setSelectedPlan] =
    useState<PlanKey | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =============================================================
  // Submit
  // =============================================================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      if (!user) {
        throw new Error(
          "User not authenticated"
        );
      }

      const normalizedFullName =
        fullName.trim();

      if (!normalizedFullName) {
        throw new Error(
          "Please enter your full name"
        );
      }

      if (normalizedFullName.length < 2) {
        throw new Error(
          "Please enter your full name"
        );
      }

      if (!selectedPlan) {
        throw new Error(
          "Please select a trial plan"
        );
      }

      setLoading(true);
      setMessage("");

      // =========================================================
      // Create farm, owner profile, farm user and trial
      // =========================================================

      await createFarmAndTrial({
        userId: user.id,
        fullName: normalizedFullName,
        farmName,
        farmType,
        currency,
        selectedPlan,
      });

      // =========================================================
      // Refresh profile to get updated role,
      // farm_id and full_name.
      // =========================================================

      await refreshProfile();

      // Small delay to ensure context has updated.
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 100)
      );

      router.push(
        "/dashboard"
      );

    } catch (error: any) {
      console.error(error);

      // =========================================================
      // Account already owns a farm
      // =========================================================

      if (
        error instanceof
        FarmAlreadyExistsError
      ) {
        setMessage(
          error.message
        );

        await refreshProfile();

        setTimeout(() => {
          router.push(
            "/dashboard"
          );
        }, 1500);

        return;
      }

      setMessage(
        error?.message ||
          "Failed to create farm"
      );

    } finally {
      setLoading(false);
    }
  }

  // =============================================================
  // UI
  // =============================================================

  return (
    <div
      className="
        w-full
        max-w-5xl
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-8
        shadow-sm
      "
    >
      <h1 className="text-3xl font-bold">
        Welcome to PoultryOps
      </h1>

      <p className="mt-2 text-slate-500">
        Let's set up your farm and start your free trial.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-8"
      >
        {/* =====================================================
            Farm Details
            ===================================================== */}

        <div className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Farm Details
          </h2>

          {/* Full Name */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Full Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) =>
                setFullName(
                  e.target.value
                )
              }
              placeholder="Enter your full name"
              className="
                w-full
                rounded-xl
                border
                p-3
              "
              required
              minLength={2}
              autoComplete="name"
            />

            <p className="mt-1 text-xs text-slate-500">
              This name will be used to identify you in PoultryOps records and audit history.
            </p>
          </div>

          {/* Farm Name */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Farm Name
            </label>

            <input
              type="text"
              value={farmName}
              onChange={(e) =>
                setFarmName(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                p-3
              "
              required
            />
          </div>

          {/* Farm Type */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Farm Type
            </label>

            <select
              value={farmType}
              onChange={(e) =>
                setFarmType(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                p-3
              "
            >
              <option>
                Poultry
              </option>
            </select>
          </div>

          {/* Currency */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Currency
            </label>

            <select
              value={currency}
              onChange={(e) =>
                setCurrency(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                p-3
              "
            >
              <option value="NGN">
                Nigerian Naira (₦)
              </option>

              <option value="USD">
                US Dollar ($)
              </option>

              <option value="EUR">
                Euro (€)
              </option>

              <option value="GBP">
                British Pound (£)
              </option>

              <option value="CAD">
                Canadian Dollar (C$)
              </option>

              <option value="AUD">
                Australian Dollar (A$)
              </option>

              <option value="GHS">
                Ghanaian Cedi (GH₵)
              </option>

              <option value="KES">
                Kenyan Shilling (KSh)
              </option>

              <option value="ZAR">
                South African Rand (R)
              </option>
            </select>
          </div>
        </div>

        {/* =====================================================
            Trial Plan
            ===================================================== */}

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Choose Your Trial Plan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a plan to start your 14-day free trial.
              You can upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLAN_ORDER.map(
              (planKey) => {
                const plan =
                  PLANS[planKey];

                const isSelected =
                  selectedPlan ===
                  planKey;

                return (
                  <div
                    key={planKey}
                    onClick={() =>
                      setSelectedPlan(
                        planKey
                      )
                    }
                    className={`
                      relative
                      flex
                      cursor-pointer
                      flex-col
                      rounded-2xl
                      border-2
                      p-6
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
                      <div className="absolute right-3 top-3">
                        <div className="
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-600
                        ">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="mb-4 text-center">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {plan.name}
                      </h3>
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Monthly */}

                      <div className="
                        border-b
                        border-gray-200
                        pb-4
                        text-center
                      ">
                        <p className="
                          mb-1
                          text-sm
                          font-medium
                          text-gray-500
                        ">
                          Monthly
                        </p>

                        <div className="
                          flex
                          items-baseline
                          justify-center
                          gap-1
                        ">
                          <span className="
                            text-2xl
                            font-bold
                            text-gray-900
                          ">
                            ₦
                            {plan.monthly.toLocaleString(
                              "en-NG"
                            )}
                          </span>

                          <span className="
                            text-sm
                            font-medium
                            text-gray-500
                          ">
                            /mo
                          </span>
                        </div>
                      </div>

                      {/* Annual */}

                      <div className="text-center">
                        <p className="
                          mb-1
                          text-sm
                          font-medium
                          text-gray-500
                        ">
                          Annual
                        </p>

                        <div className="
                          flex
                          items-baseline
                          justify-center
                          gap-1
                        ">
                          <span className="
                            text-2xl
                            font-bold
                            text-gray-900
                          ">
                            ₦
                            {plan.annual.toLocaleString(
                              "en-NG"
                            )}
                          </span>

                          <span className="
                            text-sm
                            font-medium
                            text-gray-500
                          ">
                            /yr
                          </span>
                        </div>

                        <div className="mt-2">
                          <span className="
                            inline-flex
                            items-center
                            rounded-full
                            bg-green-50
                            px-2
                            py-0.5
                            text-xs
                            font-medium
                            text-green-600
                          ">
                            {
                              ANNUAL_SAVINGS[
                                planKey
                              ]
                            }
                          </span>
                        </div>
                      </div>

                      {/* Features */}

                      <div className="
                        space-y-2
                        pt-2
                      ">
                        <p className="
                          text-sm
                          font-semibold
                          uppercase
                          tracking-wider
                          text-gray-900
                        ">
                          Features
                        </p>

                        <ul className="space-y-2">
                          {PLAN_FEATURES[
                            planKey
                          ].map(
                            (
                              feature,
                              i
                            ) => (
                              <li
                                key={i}
                                className="
                                  flex
                                  items-start
                                  gap-2
                                "
                              >
                                <Check className="
                                  mt-0.5
                                  h-4
                                  w-4
                                  shrink-0
                                  text-blue-600
                                " />

                                <span className="
                                  text-sm
                                  text-gray-600
                                ">
                                  {feature}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {!selectedPlan && (
            <p className="
              rounded-lg
              border
              border-amber-200
              bg-amber-50
              p-3
              text-sm
              text-amber-600
            ">
              Please select a trial plan to continue
            </p>
          )}
        </div>

        {/* =====================================================
            Submit
            ===================================================== */}

        <button
          type="submit"
          disabled={
            loading ||
            !selectedPlan
          }
          className="
            w-full
            rounded-xl
            bg-blue-600
            p-4
            font-semibold
            text-white
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading
            ? "Creating Farm..."
            : "Start Free Trial"}
        </button>

        {message && (
          <p className="text-sm text-red-500">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}