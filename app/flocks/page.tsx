"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useFlocks } from "@/hooks/useFlocks";

import AppShell from "@/components/layout/app-shell";

import { createFlock, updateFlock, archiveFlock } from "@/lib/flocks";

import FlockModal from "@/components/flocks/flock-modal";
import FlockViewModal from "@/components/flocks/flock-view-modal";
import FlockCard from "@/components/flocks/flock-card";

import { Plus, Package, RefreshCw } from "lucide-react";

export default function FlocksPage() {
  const { user } = useAuth();

  const { farm, loading: farmLoading, error: farmError, retry: retryFarm } = useCurrentFarm();

  const farmId = farm?.id;

  const {
    flocks,
    loading: flocksLoading,
    error: flocksError,
    refresh,
  } = useFlocks(farmId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<any | null>(null);
  const [viewingFlock, setViewingFlock] = useState<any | null>(null);

  const totalBirds = flocks.reduce(
    (sum, flock) => sum + Number(flock.quantity),
    0
  );

  const layerCount = flocks.filter((f) => f.bird_type === "Layers").length;

  async function handleSave(values: any) {
    if (editingFlock) {
      await updateFlock(editingFlock.id, values);
    } else {
      await createFlock({
        ...values,
        farm_id: farmId,
      });
    }

    await refresh();
  }

  async function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this flock? Archived flocks will be hidden from the list but all data will be preserved.")) {
      return;
    }

    try {
      await archiveFlock(id);
      await refresh();
    } catch (error) {
      console.error("Failed to archive flock:", error);
    }
  }

  function handleEdit(flock: any) {
    setEditingFlock(flock);
    setIsModalOpen(true);
  }

  function handleView(flock: any) {
    setViewingFlock(flock);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingFlock(null);
  }

  function handleCloseViewModal() {
    setViewingFlock(null);
  }

  const isLoading = farmLoading || flocksLoading;

  if (isLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-5 w-64 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-48 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (farmError || flocksError) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Unable to Load Flocks
            </h2>
            <p className="text-slate-500 mb-6">
              We couldn't load your flocks. Please refresh the page or try again.
            </p>
            <button
              onClick={() => {
                retryFarm();
                refresh();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Flocks
            </h1>
            <p className="text-slate-500 mt-1">
              Manage all poultry flocks for this farm.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingFlock(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Register New Flock
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-slate-600" size={18} />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Flocks
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {flocks.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-blue-600" size={18} />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Birds
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {totalBirds.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-green-600" size={18} />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Layer Flocks
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {layerCount}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-purple-600" size={18} />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Avg. Size
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {flocks.length > 0 ? Math.round(totalBirds / flocks.length).toLocaleString() : "0"}
            </p>
          </div>
        </div>

        {/* Flock List */}
        {flocks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Package className="text-blue-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              No Flocks Yet
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Get started by registering your first flock. Track production, monitor health, and manage your poultry operations efficiently.
            </p>
            <button
              onClick={() => {
                setEditingFlock(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all"
            >
              <Plus size={20} />
              Register Your First Flock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flocks.map((flock) => (
              <FlockCard
                key={flock.id}
                flock={flock}
                onView={handleView}
                onEdit={handleEdit}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <FlockModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          flock={editingFlock}
        />

        {/* View Modal */}
        <FlockViewModal
          isOpen={!!viewingFlock}
          onClose={handleCloseViewModal}
          flock={viewingFlock}
        />
      </div>
    </AppShell>
  );
}
