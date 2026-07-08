"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

import { supabase } from "@/lib/supabase";

export default function FarmSettingsPage() {
  const { user } =
    useAuth();

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
    return <div>Loading...</div>;
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
            name: farmName || farm.name,
            currency:
              currency || farm.currency,
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
        farmName={farm?.name}
      >
        <div className="p-6 space-y-6">

          <h1 className="text-4xl font-bold">
            Farm Settings
          </h1>

          <div className="bg-white rounded-3xl border p-6">

            <div className="space-y-4">

              <div>

                <label className="block mb-2 font-medium">
                  Farm Name
                </label>

                <input
                  defaultValue={farm?.name}
                  onChange={(e) =>
                    setFarmName(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-xl p-3"
                />

              </div>

              <div>

                <label className="block mb-2 font-medium">
                  Currency
                </label>

                <select
                  defaultValue={
                    farm?.currency
                  }
                  onChange={(e) =>
                    setCurrency(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-xl p-3"
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

              <button
                onClick={saveFarm}
                disabled={saving}
                className="
                  bg-blue-600
                  text-white
                  px-6
                  py-3
                  rounded-xl
                "
              >
                {saving
                  ? "Saving..."
                  : "Save Settings"}
              </button>

              {message && (
                <p className="text-green-600">
                  {message}
                </p>
              )}

            </div>

          </div>

        </div>
      </AppShell>
    </OwnerOnly>
  );
}