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

  const totalBirds =
    flocks.reduce(
      (
        sum,
        flock
      ) =>
        sum +
        Number(
          flock.quantity
        ),
      0
    );

  const layerCount =
    flocks.filter(
      (f) =>
        f.bird_type ===
        "Layers"
    ).length;

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

          <h1 className="text-4xl font-bold text-slate-900">
            Flock Management
          </h1>

          <p className="text-slate-500 mt-1">
            Manage bird groups and inventory
          </p>

        </div>

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-3
            gap-4
          "
        >
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Total Flocks
            </p>

            <p className="text-4xl font-bold mt-2">
              {flocks.length}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Total Birds
            </p>

            <p className="text-4xl font-bold mt-2 text-blue-600">
              {totalBirds}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
            <p className="text-slate-500 text-sm">
              Layer Flocks
            </p>

            <p className="text-4xl font-bold mt-2 text-green-600">
              {layerCount}
            </p>
          </div>
        </div>

        <FlockList
          flocks={flocks}
        />

        <AddFlockForm
          farmId={farmId}
        />

      </div>
    </AppShell>
  );
}