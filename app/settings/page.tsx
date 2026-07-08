"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

export default function SettingsPage() {
  const { user } = useAuth();

  const { data, loading } =
    useDashboard();

  if (loading) {
    return <div>Loading...</div>;
  }

  const plan =
    data?.subscription?.plan ||
    "trial";

  const userLimit =
    plan === "business"
      ? 6
      : plan === "team"
      ? 3
      : 1;

  return (
    <OwnerOnly>
      <AppShell
        email={user?.email}
        farmName={data?.farm?.name}
      >
        <div className="p-6 space-y-6">

          <h1 className="text-4xl font-bold">
            Settings
          </h1>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Subscription */}

            <div className="bg-white rounded-3xl p-6 border shadow-sm">

              <h2 className="text-2xl font-semibold mb-4">
                Subscription
              </h2>

              <div className="space-y-3">

                <div>
                  <p className="text-sm text-slate-500">
                    Current Plan
                  </p>

                  <p className="text-xl font-bold">
                    {plan === "trial"
                      ? "14-Day Trial"
                      : plan.charAt(0).toUpperCase() +
                        plan.slice(1)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    User Limit
                  </p>

                  <p className="font-medium">
                    {userLimit}{" "}
                    {userLimit === 1
                      ? "User"
                      : "Users"}
                  </p>
                </div>

              </div>

              <Link
                href="/settings/subscription"
                className="mt-6 inline-flex px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                Manage Subscription
              </Link>

            </div>

            {/* Users */}

            <div className="bg-white rounded-3xl p-6 border shadow-sm">

              <h2 className="text-2xl font-semibold mb-4">
                User Management
              </h2>

              <p className="text-gray-600 mb-4">
                Manage farm users and permissions.
              </p>

              <Link
                href="/settings/users"
                className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                Open User Management
              </Link>

            </div>

            {/* Farm */}

            <div className="bg-white rounded-3xl p-6 border shadow-sm">

              <h2 className="text-2xl font-semibold mb-4">
                Farm Settings
              </h2>

              <p className="text-gray-600 mb-4">
                Manage farm information and currency.
              </p>

              <Link
                href="/settings/farm"
                className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                Open Farm Settings
              </Link>

            </div>

            {/* Migration */}

            <div className="bg-white rounded-3xl p-6 border shadow-sm">

              <h2 className="text-2xl font-semibold mb-4">
                Data Migration
              </h2>

              <p className="text-gray-600 mb-4">
                Import historical records from Excel spreadsheets.
              </p>

              <Link
                href="/settings/migration"
                className="inline-flex px-4 py-2 bg-green-600 text-white rounded-xl"
              >
                Open Migration
              </Link>

            </div>

          </div>

        </div>
      </AppShell>
    </OwnerOnly>
  );
}