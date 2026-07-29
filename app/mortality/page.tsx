"use client";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useMortality } from "@/hooks/useMortality";

import { getFarmFlocks } from "@/lib/flocks";

import AppShell from "@/components/layout/app-shell";

import AddMortalityForm from "@/components/mortality/add-mortality-form";
import MortalityList from "@/components/mortality/mortality-list";

export default function MortalityPage() {
  const { user } =
    useAuth();

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
    refresh,
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

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayMortality =
    records
      .filter(
        (record) =>
          record.mortality_date ===
          today
      )
      .reduce(
        (
          sum,
          record
        ) =>
          sum +
          Number(
            record.quantity
          ),
        0
      );

  const totalMortality =
    records.reduce(
      (
        sum,
        record
      ) =>
        sum +
        Number(
          record.quantity
        ),
      0
    );

  const recordCount =
    records.length;

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

        <h1 className="text-4xl font-bold">
          Mortality Management
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Today
            </p>

            <p className="text-4xl font-bold mt-2 text-red-600">
              {todayMortality}
            </p>

            <p className="text-slate-500 mt-1">
              Birds
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Total Mortality
            </p>

            <p className="text-4xl font-bold mt-2 text-red-600">
              {totalMortality}
            </p>

            <p className="text-slate-500 mt-1">
              Birds
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Records
            </p>

            <p className="text-4xl font-bold mt-2">
              {recordCount}
            </p>
          </div>

        </div>

        <MortalityList
          records={records}
        />

        <AddMortalityForm
          farmId={farmId}
          flocks={flocks}
          onSaved={refresh}
        />

      </div>
    </AppShell>
  );
}