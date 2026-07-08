"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

export default function SettingsPage() {
  const { user } = useAuth();

  const { data, loading } = useDashboard();

  if (loading) {
    return <div>Loading...</div>;
  }

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

        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">
            User Management
          </h2>

          <p className="text-gray-600 mb-4">
            Manage farm users, managers and staff.
          </p>

          <Link
            href="/settings/users"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl"
          >
            Open User Management
          </Link>
        </div>

      </div>
    </AppShell>
  </OwnerOnly>
);
}