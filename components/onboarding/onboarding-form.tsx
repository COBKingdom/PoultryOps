"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { createFarmAndTrial } from "@/lib/onboarding";

export default function OnboardingForm() {
  const router = useRouter();

  const { user } = useAuth();

  const [farmName, setFarmName] =
    useState("");

  const [farmType, setFarmType] =
    useState("Poultry");

  const [currency, setCurrency] =
    useState("NGN");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

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

      setLoading(true);
      setMessage("");

      await createFarmAndTrial({
        userId: user.id,
        farmName,
        farmType,
        currency,
      });

      router.push(
        "/dashboard"
      );

    } catch (error: any) {
      console.error(error);

      setMessage(
        error.message ||
          "Failed to create farm"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        w-full
        max-w-xl
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
        Let's set up your farm and
        start your free trial.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 mt-8"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
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
            onChange={(e) =>
              setFarmType(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3"
          >
            <option>
              Poultry
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Currency
          </label>

          <select
            value={currency}
            onChange={(e) =>
              setCurrency(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3"
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

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            text-white
            rounded-xl
            p-4
            font-semibold
          "
        >
          {loading
            ? "Creating Farm..."
            : "Start Free Trial"}
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