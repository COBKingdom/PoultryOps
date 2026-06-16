"use client";

import { useState, useEffect } from "react";

import AppShell from "@/components/layout/app-shell";

import { useDashboard } from "@/hooks/useDashboard";

import { updateFarm } from "@/lib/farm";

export default function SettingsPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const [farmName, setFarmName] =
    useState("");

  const [currency, setCurrency] =
    useState("NGN");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!farm) return;

    setFarmName(
      farm.name || ""
    );

    setCurrency(
      farm.currency ||
        "NGN"
    );
  }, [farm]);

  async function handleSave() {
    try {
      if (!farm?.id) return;

      setSaving(true);

      await updateFarm(
        farm.id,
        {
          name: farmName,
          currency,
        }
      );

      alert(
        "Settings saved successfully"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <AppShell>

      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage farm preferences
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

          <h2 className="text-xl font-semibold mb-6">
            Farm Settings
          </h2>

          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-2">
                Farm Name
              </label>

              <input
                value={farmName}
                onChange={(e) =>
                  setFarmName(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                "
              />
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
                className="
                  w-full
                  border
                  rounded-xl
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

                <option value="ZAR">
                  South African Rand (R)
                </option>

                <option value="GHS">
                  Ghanaian Cedi (GH₵)
                </option>

                <option value="KES">
                  Kenyan Shilling (KSh)
                </option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="
                bg-blue-600
                text-white
                px-6
                py-3
                rounded-xl
                font-medium
              "
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>

          </div>

        </div>

      </div>

    </AppShell>
  );
}