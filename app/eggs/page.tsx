"use client";

import { useEffect, useState } from "react";

import { useDashboard } from "@/hooks/useDashboard";
import { useEggProduction } from "@/hooks/useEggProduction";

import { getFarmFlocks } from "@/lib/flocks";

import AddEggForm from "@/components/eggs/add-egg-form";
import EggProductionList from "@/components/eggs/egg-production-list";

export default function EggsPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const {
    records,
  } = useEggProduction(
    farmId
  );

  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const result =
        await getFarmFlocks(
          farmId
        );

      setFlocks(result);
    }

    load();
  }, [farmId]);

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
        Egg Production
      </h1>

      <AddEggForm
        farmId={farmId}
        flocks={flocks}
      />

      <EggProductionList
        records={records}
      />

    </div>
  );
}