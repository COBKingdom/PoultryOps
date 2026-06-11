"use client";

import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/app-shell";

export default function SettingsPage() {
  const { user } = useAuth();

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
            Manage your PoultryOps account.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4">
            Account
          </h2>

          <p className="text-slate-700">
            <strong>Email:</strong>{" "}
            {user?.email}
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4">
            Subscription
          </h2>

          <p className="text-slate-700">
            Trial Subscription Active
          </p>

          <button
            className="
              mt-4
              px-4
              py-2
              rounded-lg
              bg-blue-600
              text-white
            "
          >
            Upgrade Plan
          </button>

        </div>

      </div>
    </AppShell>
  );
}