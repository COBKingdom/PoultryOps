"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useHealth } from "@/hooks/useHealth";
import { useFlocks } from "@/hooks/useFlocks";

import AddHealthForm from "@/components/health/add-health-form";
import HealthList from "@/components/health/health-list";
import HealthStats from "@/components/health/health-stats";

export default function HealthPage() {
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
      />

    </div>
  );
}