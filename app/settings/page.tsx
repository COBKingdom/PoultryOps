"use client";

import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/app-shell";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Account Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your PoultryOps account.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <h2 className="text-xl font-semibold mb-4">
            Account Information
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

          <p className="text-slate-500 mt-2">
            Subscription management will be available in a future release.
          </p>

        </div>

      </div>
    </AppShell>
  );
}