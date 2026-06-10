"use client";

import {
  useEffect,
  useState,
} from "react";

import { useDashboard } from "@/hooks/useDashboard";
import { useMortality } from "@/hooks/useMortality";

import { getFarmFlocks } from "@/lib/flocks";

import AddMortalityForm from "@/components/mortality/add-mortality-form";
import MortalityList from "@/components/mortality/mortality-list";

export default function MortalityPage() {
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
  } = useMortality(
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
        Mortality
      </h1>

      <AddMortalityForm
        farmId={farmId}
        flocks={flocks}
      />

      <MortalityList
        records={records}
      />

    </div>
  );
}