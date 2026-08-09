"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useEggProduction } from "@/hooks/useEggProduction";

import { getFarmFlocks } from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import { Egg, TrendingUp } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddEggForm from "@/components/eggs/add-egg-form";
import EggProductionList from "@/components/eggs/egg-production-list";
import EditEggForm from "@/components/eggs/edit-egg-form";


export default function EggsPage() {
  const { user, profile } = useAuth();

  const { farm, loading: farmLoading } = useCurrentFarm();

  const farmId = farm?.id;

  const [flocks, setFlocks] = useState<any[]>([]);

  const { records, loading: recordsLoading, refresh } = useEggProduction(farmId);

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const result = await getFarmFlocks(farmId);

      setFlocks(result);
    }

    load();
  }, [farmId]);

  // ── Compute KPI values (same logic as EggProductionSummary) ──────────────
  const today = new Date().toISOString().split("T")[0];

  const kpiValues = useMemo(() => {
    const todayEggs = records
      .filter((record) => record.production_date === today)
      .reduce((sum, record) => sum + Number(record.egg_count), 0);

    const totalEggs = records.reduce(
      (sum, record) => sum + Number(record.egg_count),
      0
    );

    const crackedEggs = records.reduce(
      (sum, record) => sum + Number(record.cracked_eggs || 0),
      0
    );

    return { todayEggs, totalEggs, crackedEggs };
  }, [records, today]);

  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.flocks?.flock_name?.toLowerCase().includes(query) ||
        record.production_date?.toLowerCase().includes(query) ||
        String(record.egg_count).includes(query)
    );
  }, [records, searchQuery]);

  // ── Paginate filtered records ─────────────────────────────────────────────
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + pageSize
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Today"
        value={kpiValues.todayEggs}
        sublabel="Eggs"
        icon={<Egg size={20} />}
        valueColor="amber"
        iconBg="amber"
      />
      <OperationsKpiCard
        label="Records"
        value={records.length}
        icon={<TrendingUp size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
      <OperationsKpiCard
        label="Total Eggs"
        value={kpiValues.totalEggs}
        icon={<Egg size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
      <OperationsKpiCard
        label="Cracked Eggs"
        value={kpiValues.crackedEggs}
        icon={<Egg size={20} />}
        valueColor="amber"
        iconBg="amber"
      />
    </>
  );

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search production records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );

  const pagination = (
    <OperationsPagination
      current={currentPage}
      total={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
    />
  );

  function handleEditRecord(record: any) {
    // Check Edit Governance
    const governanceResult = canEdit(
      { id: user?.id || "", role: profile?.role || "" },
      record
    );

    if (!governanceResult.allowed) {
      alert(governanceResult.reason || "You cannot edit this record at this time.");
      return;
    }

    setEditingRecord(record);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  }

  if (farmLoading) {
    return (
      <AppShell email={user?.email || ""}>
        <div className="space-y-6">
          <div />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email || ""}>
      <div className="space-y-6">
        {/* ── Page Title ─────────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-slate-900">Egg Production</h1>

        {/* ── KPI cards section ─────────────────────────────────────────── */}
        {kpiCards && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards}
          </div>
        )}

        {/* ── Filter / Search toolbar ───────────────────────────────────── */}
        {toolbar && (
          <div className="flex items-center justify-between">
            {toolbar}
          </div>
        )}

        {/* ── Main content: Quick Entry + Activity list ─────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Quick Entry — first on mobile, right column on desktop */}
          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">
              <AddEggForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Activity list container (spans 8 of 12 columns on desktop) */}
          <div className="lg:col-span-8 lg:order-first">
            {recordsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <EggProductionList
                records={paginatedRecords}
                onEdit={handleEditRecord}
              />
            )}
          </div>
        </div>

        {/* ── Pagination area ───────────────────────────────────────────── */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

        {/* ── Edit Modal ───────────────────────────────────────────────── */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <EditEggForm
                record={editingRecord}
                flocks={flocks}
                onClose={handleCloseEditModal}
                onSaved={refresh}
                user={user}
                profile={profile}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
