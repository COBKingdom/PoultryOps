"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useEggProduction } from "@/hooks/useEggProduction";

import { getFarmFlocks } from "@/lib/flocks";

import AppShell from "@/components/layout/app-shell";

import AddEggForm from "@/components/eggs/add-egg-form";
import EggProductionList from "@/components/eggs/egg-production-list";
import EggProductionSummary from "@/components/eggs/egg-production-summary";

export default function EggsPage() {
  const { user } =
    useAuth();

  const { farm, loading: farmLoading } = useCurrentFarm();

  const farmId = farm?.id;

  const [flocks, setFlocks] =
    useState<any[]>([]);

const {
  records,
  refresh,
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

  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      email={user?.email}
    >
      <div className="p-6 space-y-6">

        <h1 className="text-3xl font-bold">
          Egg Production
        </h1>

        <EggProductionSummary
          records={records}
        />

        <EggProductionList
          records={records}
        />

         <AddEggForm
          farmId={farmId}
          flocks={flocks}
          onSaved={refresh}
        />

      </div>
    </AppShell>
  );
}