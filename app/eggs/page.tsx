"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useEggProduction } from "@/hooks/useEggProduction";

import { getFarmFlocks } from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import { Egg, TrendingUp } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddEggForm from "@/components/eggs/add-egg-form";
import EggProductionList from "@/components/eggs/egg-production-list";
import EditEggForm from "@/components/eggs/edit-egg-form";

export default function EggsPage() {
  const { user, profile } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const farmId = farm?.id;

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const {
    records,
    loading: recordsLoading,
    refresh,
  } = useEggProduction(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const pageSize = 10;

  const [dateRangeSelection, setDateRangeSelection] =
    useState<DateRangeSelection>(
      getDefaultDateRangeSelection()
    );

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState<any | null>(null);

  /*
   * Load farm flocks.
   */
  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const result =
        await getFarmFlocks(farmId);

      setFlocks(result);
    }

    load();
  }, [farmId]);

  /*
   * Filter egg production records by
   * selected date range.
   *
   * Egg production uses production_date.
   */
  const dateFilteredRecords = useMemo(() => {
    const {
      start,
      end,
    } = dateRangeSelection.range;

    return records.filter((record) => {
      const productionDate =
        record.production_date;

      if (!productionDate) return false;

      return (
        productionDate >= start &&
        productionDate <= end
      );
    });
  }, [
    records,
    dateRangeSelection,
  ]);

  /*
   * Compute KPI values from the selected
   * date range.
   */
  const kpiValues = useMemo(() => {
    const totalEggs =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.egg_count || 0),
        0
      );

    const crackedEggs =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.cracked_eggs || 0),
        0
      );

    const recordCount =
      dateFilteredRecords.length;

    return {
      totalEggs,
      crackedEggs,
      recordCount,
    };
  }, [dateFilteredRecords]);

  /*
   * Apply search after the date filter.
   */
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateFilteredRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return dateFilteredRecords.filter(
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.production_date
          ?.toLowerCase()
          .includes(query) ||
        String(record.egg_count)
          .includes(query) ||
        String(record.cracked_eggs)
          .includes(query)
    );
  }, [
    dateFilteredRecords,
    searchQuery,
  ]);

  /*
   * Pagination.
   */
  const totalItems =
    filteredRecords.length;

  const totalPages =
    Math.ceil(
      totalItems / pageSize
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    pageSize;

  const paginatedRecords =
    filteredRecords.slice(
      startIndex,
      startIndex + pageSize
    );

  /*
   * Reset pagination whenever search
   * or date range changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    dateRangeSelection,
  ]);

  /*
   * Edit governance.
   */
  function handleEditRecord(
    record: any
  ) {
    const governanceResult =
      canEdit(
        {
          id: user?.id || "",
          role: profile?.role || "",
        },
        record
      );

    if (!governanceResult.allowed) {
      alert(
        governanceResult.reason ||
          "You cannot edit this record at this time."
      );

      return;
    }

    setEditingRecord(record);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  }

  /*
   * KPI cards.
   */
  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Eggs"
        value={kpiValues.totalEggs}
        sublabel="Eggs"
        icon={<Egg size={20} />}
        valueColor="amber"
        iconBg="amber"
      />

      <OperationsKpiCard
        label="Records"
        value={kpiValues.recordCount}
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

  /*
   * Search toolbar.
   */
  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search production records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );

  /*
   * Pagination.
   */
  const pagination = (
    <OperationsPagination
      current={currentPage}
      total={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
    />
  );

  /*
   * Loading state.
   */
  if (farmLoading) {
    return (
      <AppShell
        email={user?.email || ""}
      >
        <div className="space-y-6">
          <div />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      email={user?.email || ""}
    >
      <div className="space-y-6">

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900">
          Egg Production
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards}
        </div>

        {/* Search + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          <div className="flex-1">
            {toolbar}
          </div>

          <div className="flex-shrink-0">
            <ReportFilter
              value={dateRangeSelection}
              onChange={setDateRangeSelection}
            />
          </div>

        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}
          <div className="lg:col-span-4 lg:order-last">

            <div className="lg:sticky lg:top-20 space-y-4">

              <AddEggForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>

          </div>

          {/* Production List */}
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

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen &&
          editingRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

                <EditEggForm
                  record={editingRecord}
                  flocks={flocks}
                  onClose={
                    handleCloseEditModal
                  }
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