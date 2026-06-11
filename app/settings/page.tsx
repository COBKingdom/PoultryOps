"use client";

import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/app-shell";

export default function SettingsPage() {
  const { user, signOut } =
    useAuth();

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your account and application preferences.
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4">
            Account
          </h2>

          <div className="space-y-2">

            <p>
              <span className="font-medium">
                Email:
              </span>{" "}
              {user?.email}
            </p>

            <p>
              <span className="font-medium">
                Status:
              </span>{" "}
              Active
            </p>

          </div>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4">
            Subscription
          </h2>

          <p className="text-slate-600">
            Trial subscription active.
          </p>

          <button
            className="
              mt-4
              bg-blue-600
              text-white
              px-4
              py-2
              rounded-lg
            "
          >
            Upgrade Plan
          </button>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Danger Zone
          </h2>

          <button
            onClick={signOut}
            className="
              bg-red-600
              text-white
              px-4
              py-2
              rounded-lg
            "
          >
            Sign Out
          </button>

        </div>

      </div>
    </AppShell>
  );
}