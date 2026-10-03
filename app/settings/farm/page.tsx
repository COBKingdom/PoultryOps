"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

import { supabase } from "@/lib/supabase";

export default function FarmSettingsPage() {
  const { user } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [farmName, setFarmName] =
    useState("");

  const [currency, setCurrency] =
    useState("");

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">

          <div>
            <div className="h-10 w-56 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-80 bg-slate-200 rounded animate-pulse" />
          </div>

          <div
            className="
              relative overflow-hidden
              rounded-xl
              border border-blue-100
              bg-white
              p-6
              shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="space-y-6 pt-1">

              <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />

              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
              </div>

              <div className="h-12 w-36 bg-slate-200 rounded-xl animate-pulse" />

            </div>
          </div>

        </div>
      </AppShell>
    );
  }

  const farm =
    data?.farm;

  async function saveFarm() {
    try {
      setSaving(true);
      setMessage("");

      const { error } =
        await supabase
          .from("farms")
          .update({
            name:
              farmName ||
              farm.name,
            currency:
              currency ||
              farm.currency,
          })
          .eq("id", farm.id);

      if (error) throw error;

      setMessage(
        "Farm settings updated successfully."
      );
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerOnly>
      <AppShell
        email={user?.email}
      >
        <div className="space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Farm Settings
            </h1>

            <p className="mt-1 text-slate-500">
              Manage your farm information and currency settings.
            </p>
          </div>

          {/* Farm Settings Card */}
          <div
            className="
              relative overflow-hidden
              rounded-xl
              border border-blue-100
              bg-white
              p-6
              shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="space-y-6 pt-1">

              {/* Section Heading */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Farm Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the basic information used throughout PoultryOps.
                </p>
              </div>

              {/* Farm Name */}
              <div>
                <label
                  htmlFor="farm-name"
                  className="block mb-2 text-sm font-medium text-slate-600"
                >
                  Farm Name
                </label>

                <input
                  id="farm-name"
                  defaultValue={farm?.name}
                  onChange={(e) =>
                    setFarmName(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4 py-3
                    text-slate-800
                    placeholder:text-slate-400
                    focus:outline-none
                    focus:border-blue-300
                    focus:ring-2
                    focus:ring-blue-200
                    transition-all
                  "
                />
              </div>

              {/* Currency */}
              <div>
                <label
                  htmlFor="farm-currency"
                  className="block mb-2 text-sm font-medium text-slate-600"
                >
                  Currency
                </label>

                <select
                  id="farm-currency"
                  defaultValue={
                    farm?.currency
                  }
                  onChange={(e) =>
                    setCurrency(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4 py-3
                    text-slate-800
                    focus:outline-none
                    focus:border-blue-300
                    focus:ring-2
                    focus:ring-blue-200
                    transition-all
                  "
                >
                  <option value="NGN">
                    NGN
                  </option>

                  <option value="USD">
                    USD
                  </option>

                  <option value="EUR">
                    EUR
                  </option>

                  <option value="GBP">
                    GBP
                  </option>
                </select>
              </div>

              {/* Save + Message */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">

                <button
                  onClick={saveFarm}
                  disabled={saving}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-600
                    px-6 py-3
                    text-white
                    font-semibold
                    shadow-[3px_4px_0_rgba(30,64,175,0.18),0_6px_18px_rgba(15,23,42,0.08)]
                    hover:bg-blue-700
                    hover:-translate-y-0.5
                    hover:shadow-[4px_6px_0_rgba(30,64,175,0.22),0_9px_22px_rgba(15,23,42,0.10)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    disabled:hover:translate-y-0
                    transition-all
                    duration-200
                  "
                >
                  {saving
                    ? "Saving..."
                    : "Save Settings"}
                </button>

                {message && (
                  <p
                    className="
                      text-sm
                      font-medium
                      text-green-600
                    "
                  >
                    {message}
                  </p>
                )}

              </div>

            </div>
          </div>

        </div>
      </AppShell>
    </OwnerOnly>
  );
}