"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useHealth } from "@/hooks/useHealth";
import { useFlocks } from "@/hooks/useFlocks";

import { useEffect, useMemo, useState } from "react";

import { Activity } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddHealthForm from "@/components/health/add-health-form";
import HealthList from "@/components/health/health-list";

export default function HealthPage() {
  const { user } =
    useAuth();

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
  refresh,
} = useHealth(
  farmId
);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);
  const pageSize = 10;

  // ── Compute KPI values ────────────────────────────────────────────────────
  const kpiValues = useMemo(() => {
    const totalRecords = records.length;
    
    const activeCases = records.filter(
      (record) => record.status === 'active' || record.status === 'treatment'
    ).length;

    return { totalRecords, activeCases };
  }, [records]);

  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.flocks?.flock_name?.toLowerCase().includes(query) ||
        record.diagnosis?.toLowerCase().includes(query) ||
        record.treatment?.toLowerCase().includes(query)
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
        label="Total Records"
        value={kpiValues.totalRecords}
        icon={<Activity size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
      <OperationsKpiCard
        label="Active Cases"
        value={kpiValues.activeCases}
        icon={<Activity size={20} />}
        valueColor="amber"
        iconBg="amber"
      />
    </>
  );

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search health records..."
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
        <h1 className="text-2xl font-bold text-slate-900">Health & Treatments</h1>

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
              <AddHealthForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <HealthList
              records={paginatedRecords}
            />
          </div>
        </div>

        {/* ── Pagination area ───────────────────────────────────────────── */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

      </div>
    </AppShell>
  );
}