"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useFlocks } from "@/hooks/useFlocks";

import AppShell from "@/components/layout/app-shell";

import AddFlockForm from "@/components/flocks/add-flock-form";
import FlockList from "@/components/flocks/flock-list";

export default function FlocksPage() {
  const { user } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    flocks,
  } = useFlocks(
    farmId
  );

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
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Flocks
          </h1>

          <p className="text-slate-500 mt-1">
            Manage poultry flocks and bird inventory
          </p>

        </div>

        <AddFlockForm
          farmId={farmId}
        />

        <FlockList
          flocks={flocks}
        />

      </div>
    </AppShell>
  );
}