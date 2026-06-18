"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";

export default function ProfilePage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  const farm =
    data?.farm;

  const subscription =
    data?.subscription;

  const trialEnd =
    subscription?.trial_end
      ? new Date(
          subscription.trial_end
        )
      : null;

  const today =
    new Date();

  const daysRemaining =
    trialEnd
      ? Math.max(
          0,
          Math.ceil(
            (trialEnd.getTime() -
              today.getTime()) /
              (1000 *
                60 *
                60 *
                24)
          )
        )
      : 0;

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold">
            Profile
          </h1>

          <p className="text-slate-500 mt-2">
            Account information and subscription details.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Account
            </h2>

            <div className="space-y-4">

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

              <div>
                <p className="text-sm text-slate-500">
                  Account Status
                </p>

                <p className="font-medium text-green-600">
                  Active
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Farm
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-slate-500">
                  Farm Name
                </p>

                <p className="font-medium">
                  {farm?.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Farm Type
                </p>

                <p className="font-medium">
                  {farm?.farm_type}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Currency
                </p>

                <p className="font-medium">
                  {farm?.currency}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Subscription
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-slate-500">
                  Plan
                </p>

                <p className="font-medium capitalize">
                  {subscription?.plan}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Status
                </p>

                <p className="font-medium capitalize">
                  {subscription?.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Days Remaining
                </p>

                <p className="font-medium text-blue-600">
                  {daysRemaining} Days
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Trial Ends
                </p>

                <p className="font-medium">
                  {trialEnd?.toLocaleDateString()}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h2 className="text-xl font-semibold mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3">

              <a
                href="/dashboard"
                className="block border rounded-xl p-3 hover:bg-slate-50"
              >
                Dashboard
              </a>

              <a
                href="/settings"
                className="block border rounded-xl p-3 hover:bg-slate-50"
              >
                Farm Settings
              </a>

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}