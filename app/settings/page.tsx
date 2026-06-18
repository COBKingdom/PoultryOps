"use client";

import {
  useState,
  useEffect,
} from "react";

import { useAuth } from "@/contexts/AuthContext";

import AppShell from "@/components/layout/app-shell";

import { useDashboard } from "@/hooks/useDashboard";

import { updateFarm } from "@/lib/farm";

import SaveButton from "@/components/ui/save-button";

export default function SettingsPage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const subscription =
    data?.subscription;

  const [farmName, setFarmName] =
    useState("");

  const [currency, setCurrency] =
    useState("NGN");

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
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

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);

    } finally {
      setSaving(false);
    }
  }

  const trialEnd =
    subscription?.trial_end
      ? new Date(
          subscription.trial_end
        )
      : null;

  const daysRemaining =
    trialEnd
      ? Math.max(
          0,
          Math.ceil(
            (trialEnd.getTime() -
              Date.now()) /
              (1000 *
                60 *
                60 *
                24)
          )
        )
      : 0;

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your farm,
            account and
            subscription
            preferences.
          </p>

        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <h2 className="text-xl font-semibold mb-6">
              Farm Settings
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >

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

              <SaveButton
                loading={saving}
                success={success}
                label="Save Settings"
              />

            </form>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <h2 className="text-xl font-semibold mb-6">
              Subscription
            </h2>

            <div className="space-y-4">

              <div>

                <p className="text-sm text-slate-500">
                  Plan
                </p>

                <p className="font-semibold">
                  {subscription?.plan ||
                    "Starter"}
                </p>

              </div>

              <div>

                <p className="text-sm text-slate-500">
                  Status
                </p>

                <p className="font-semibold text-green-600">
                  {subscription?.status ||
                    "Trial"}
                </p>

              </div>

              <div>

                <p className="text-sm text-slate-500">
                  Days Remaining
                </p>

                <p className="font-semibold text-blue-600">
                  {daysRemaining}
                  {" "}
                  Days
                </p>

              </div>

              <div>

                <p className="text-sm text-slate-500">
                  Trial Ends
                </p>

                <p className="font-semibold">
                  {trialEnd
                    ?.toLocaleDateString()}
                </p>

              </div>

            </div>

          </div>

        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

          <h2 className="text-xl font-semibold mb-4">
            Account
          </h2>

          <div className="space-y-3">

            <div>

              <p className="text-sm text-slate-500">
                Email
              </p>

              <p className="font-medium">
                {user?.email}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Role
              </p>

              <p className="font-medium">
                Farm Owner
              </p>

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}