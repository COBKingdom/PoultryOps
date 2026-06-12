"use client";

import Link from "next/link";

import AppShell from "@/components/layout/app-shell";

export default function SettingsPage() {
  return (
    <AppShell>

      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your farm preferences and account.
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-2">
              Farm Settings
            </h2>

            <p className="text-slate-500">
              Configure farm details and preferences.
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Currency
            </h2>

            <select
              className="
                w-full
                border
                rounded-lg
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

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-2">
              Account
            </h2>

            <p className="text-slate-500">
              Manage your profile and login information.
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-2">
              Subscription
            </h2>

            <p className="mb-2">
              Plan: Starter
            </p>

            <p className="mb-2">
              Status: Trial
            </p>

            <p>
              Trial Active
            </p>

          </div>

        </div>

      </div>

    </AppShell>
  );
}