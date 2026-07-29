"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useHealth } from "@/hooks/useHealth";
import { useFlocks } from "@/hooks/useFlocks";

import AppShell from "@/components/layout/app-shell";

import AddHealthForm from "@/components/health/add-health-form";
import HealthList from "@/components/health/health-list";
import HealthStats from "@/components/health/health-stats";

export default function HealthPage() {
  const { user } =
    useAuth();

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

const {
  records,
  refresh,
} = useHealth(
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
      <div className="p-6 space-y-6">

        <h1 className="text-3xl font-bold">
          Health & Treatments
        </h1>

        <HealthStats
          records={records}
        />

        <HealthList
          records={records}
        />

<AddHealthForm
  farmId={farmId}
  flocks={flocks}
  onSaved={refresh}
/>

      </div>
    </AppShell>
  );
}