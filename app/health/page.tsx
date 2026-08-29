"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useHealth } from "@/hooks/useHealth";
import { useFlocks } from "@/hooks/useFlocks";

import { useEffect, useMemo, useState } from "react";

import {
  DateRangeSelection,
  getDefaultDateRangeSelection,
} from "@/lib/date-ranges";

import { canEdit } from "@/lib/permissions/governance";

import {
  Activity,
  ChevronDown,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddHealthForm from "@/components/health/add-health-form";
import HealthList from "@/components/health/health-list";
import EditHealthForm from "@/components/health/edit-health-form";

export default function HealthPage() {
  const { user, profile } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    flocks,
  } = useFlocks(farmId);

  const {
    records,
    refresh,
  } = useHealth(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFlockId, setSelectedFlockId] =
    useState("all");

  const [dateRangeSelection, setDateRangeSelection] =
    useState<DateRangeSelection>(
      getDefaultDateRangeSelection()
    );

  const [currentPage, setCurrentPage] =
    useState(1);

  const pageSize = 10;

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState<any | null>(null);

  /*
   * ---------------------------------------------------------
   * DATE FILTER
   * ---------------------------------------------------------
   */

  const dateRange =
    dateRangeSelection.range;

  const dateFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate =
        record.health_date;

      if (!recordDate) {
        return false;
      }

      return (
        recordDate >= dateRange.start &&
        recordDate <= dateRange.end
      );
    });
  }, [
    records,
    dateRange,
  ]);

  /*
   * ---------------------------------------------------------
   * FLOCK FILTER
   * ---------------------------------------------------------
   */

  const flockFilteredRecords = useMemo(() => {
    if (
      selectedFlockId === "all"
    ) {
      return dateFilteredRecords;
    }

    return dateFilteredRecords.filter(
      (record) =>
        record.flock_id ===
        selectedFlockId
    );
  }, [
    dateFilteredRecords,
    selectedFlockId,
  ]);

  /*
   * ---------------------------------------------------------
   * KPI VALUES
   *
   * KPIs are calculated AFTER the flock filter so that
   * selecting a flock gives a true flock-level view.
   * ---------------------------------------------------------
   */

  const kpiValues = useMemo(() => {
    const totalRecords =
      flockFilteredRecords.length;

    const activeCases =
      flockFilteredRecords.filter(
        (record) =>
          record.status === "active" ||
          record.status === "treatment"
      ).length;

    const totalCost =
      flockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.cost || 0
          ),
        0
      );

    return {
      totalRecords,
      activeCases,
      totalCost,
    };
  }, [
    flockFilteredRecords,
  ]);

  /*
   * ---------------------------------------------------------
   * SEARCH FILTER
   * ---------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return flockFilteredRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return flockFilteredRecords.filter(
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.diagnosis
          ?.toLowerCase()
          .includes(query) ||
        record.treatment
          ?.toLowerCase()
          .includes(query) ||
        record.treatment_name
          ?.toLowerCase()
          .includes(query) ||
        record.category
          ?.toLowerCase()
          .includes(query) ||
        record.notes
          ?.toLowerCase()
          .includes(query)
    );
  }, [
    flockFilteredRecords,
    searchQuery,
  ]);

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * RESET PAGINATION
   *
   * Whenever search, flock or date range changes,
   * return to page 1.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedFlockId,
    dateRangeSelection,
  ]);

  /*
   * ---------------------------------------------------------
   * EDIT
   * ---------------------------------------------------------
   */

  function handleEditRecord(record: any) {
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
   * ---------------------------------------------------------
   * KPI CARDS
   * ---------------------------------------------------------
   */

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

      <OperationsKpiCard
        label="Total Cost"
        value={kpiValues.totalCost}
        currency={data?.farm?.currency}
        icon={<Activity size={20} />}
        valueColor="red"
        iconBg="red"
      />
    </>
  );

  /*
   * ---------------------------------------------------------
   * TOOLBAR
   * ---------------------------------------------------------
   */

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search health records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="flex items-center gap-3">
        {/* Flock Filter */}

        <div className="relative">
          <select
            value={selectedFlockId}
            onChange={(e) =>
              setSelectedFlockId(
                e.target.value
              )
            }
            className="
              appearance-none
              min-w-[190px]
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              pr-10
              text-sm
              font-medium
              text-slate-700
              shadow-sm
              outline-none
              transition-all
              hover:border-slate-300
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
            aria-label="Filter health records by flock"
          >
            <option value="all">
              All Flocks
            </option>

            {flocks?.map(
              (flock: any) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.flock_name}
                </option>
              )
            )}
          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />
        </div>

        {/* Date Filter */}

        <ReportFilter
          value={dateRangeSelection}
          onChange={
            setDateRangeSelection
          }
        />
      </div>
    </OperationsToolbar>
  );

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div />
        </div>
      </AppShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* Page Title */}

        <h1 className="text-2xl font-bold text-slate-900">
          Health & Treatments
        </h1>

        {/* KPI Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards}
        </div>

        {/* Filter / Search Toolbar */}

        <div className="flex items-center justify-between">
          {toolbar}
        </div>

        {/* Main content */}

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}

          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">

              <AddHealthForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>
          </div>

          {/* Records List */}

          <div className="lg:col-span-8 lg:order-first">

            <HealthList
              records={paginatedRecords}
              onEdit={handleEditRecord}
              currency={
                data?.farm?.currency
              }
            />

          </div>

        </div>

        {/* Pagination */}

        <div className="flex items-center justify-center pt-4">
          {pagination}
        </div>

        {/* Edit Modal */}

        {isEditModalOpen &&
          editingRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

                <EditHealthForm
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