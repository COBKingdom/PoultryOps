"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useFlocks } from "@/hooks/useFlocks";

import AddFlockForm from "@/components/flocks/add-flock-form";
import FlockList from "@/components/flocks/flock-list";

export default function FlocksPage() {
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
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Flocks
      </h1>

      <AddFlockForm
        farmId={farmId}
      />

      <FlockList
        flocks={flocks}
      />

    </div>
  );
}