"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useMortality } from "@/hooks/useMortality";

import { getFarmFlocks } from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import { Activity } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddMortalityForm from "@/components/mortality/add-mortality-form";
import MortalityList from "@/components/mortality/mortality-list";
import EditMortalityForm from "@/components/mortality/edit-mortality-form";

export default function MortalityPage() {
  const { user, profile } =
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

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);
  const pageSize = 10;

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);
  const [editingRecord, setEditingRecord] =
    useState<any | null>(null);

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

  // ── Compute KPI values ────────────────────────────────────────────────────
  const kpiValues = useMemo(() => {
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

    return { todayMortality, totalMortality, recordCount };
  }, [records]);

  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.flocks?.flock_name?.toLowerCase().includes(query) ||
        record.mortality_date?.toLowerCase().includes(query) ||
        String(record.quantity).includes(query)
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

  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Today"
        value={kpiValues.todayMortality}
        icon={<Activity size={20} />}
        valueColor="red"
        iconBg="red"
      />
      <OperationsKpiCard
        label="Total Mortality"
        value={kpiValues.totalMortality}
        icon={<Activity size={20} />}
        valueColor="red"
        iconBg="red"
      />
      <OperationsKpiCard
        label="Records"
        value={kpiValues.recordCount}
        icon={<Activity size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
    </>
  );

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search mortality records..."
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

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* ── Page Title ─────────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-slate-900">Mortality Management</h1>

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

        {/* ── Main content: Quick Entry + Records list ─────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Quick Entry — first on mobile, right column on desktop */}
          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">
              <AddMortalityForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <MortalityList
              records={paginatedRecords}
              onEdit={handleEditRecord}
            />
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
              <EditMortalityForm
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
