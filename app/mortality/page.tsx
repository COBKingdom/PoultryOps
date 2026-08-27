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

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import {
  Activity,
  ChevronDown,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddMortalityForm from "@/components/mortality/add-mortality-form";
import MortalityList from "@/components/mortality/mortality-list";
import EditMortalityForm from "@/components/mortality/edit-mortality-form";

export default function MortalityPage() {
  const { user, profile } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId = data?.farm?.id;

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const {
    records,
    refresh,
  } = useMortality(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFlockId, setSelectedFlockId] =
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
   * Filter mortality by date range
   * and selected flock.
   */
  const dateAndFlockFilteredRecords =
    useMemo(() => {
      const {
        start,
        end,
      } = dateRangeSelection.range;

      return records.filter((record) => {
        const mortalityDate =
          record.mortality_date;

        if (!mortalityDate) {
          return false;
        }

        const matchesDate =
          mortalityDate >= start &&
          mortalityDate <= end;

        const matchesFlock =
          !selectedFlockId ||
          record.flock_id ===
            selectedFlockId;

        return (
          matchesDate &&
          matchesFlock
        );
      });
    }, [
      records,
      dateRangeSelection,
      selectedFlockId,
    ]);

  /*
   * Compute KPI values after both
   * date and flock filters.
   */
  const kpiValues = useMemo(() => {
    const selectedPeriodMortality =
      dateAndFlockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.quantity || 0),
        0
      );

    const recordCount =
      dateAndFlockFilteredRecords.length;

    return {
      selectedPeriodMortality,
      recordCount,
    };
  }, [
    dateAndFlockFilteredRecords,
  ]);

  /*
   * Apply search after date and flock filters.
   */
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateAndFlockFilteredRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return dateAndFlockFilteredRecords.filter(
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.mortality_date
          ?.toLowerCase()
          .includes(query) ||
        String(record.quantity)
          .includes(query) ||
        record.reason
          ?.toLowerCase()
          .includes(query)
    );
  }, [
    dateAndFlockFilteredRecords,
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
   * Reset pagination whenever
   * search, flock, or date range changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedFlockId,
    dateRangeSelection,
  ]);

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

  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Mortality"
        value={
          kpiValues.selectedPeriodMortality
        }
        icon={
          <Activity size={20} />
        }
        valueColor="red"
        iconBg="red"
      />

      <OperationsKpiCard
        label="Records"
        value={
          kpiValues.recordCount
        }
        icon={
          <Activity size={20} />
        }
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
      <AppShell
        email={user?.email}
      >
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

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900">
          Mortality Management
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards}
        </div>

        {/* Search + Flock Filter + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

          <div className="flex-1">
            {toolbar}
          </div>

          {/* Flock Filter */}
          <div className="relative flex-shrink-0">
            <select
              value={selectedFlockId}
              onChange={(event) =>
                setSelectedFlockId(
                  event.target.value
                )
              }
              className="
                appearance-none
                w-full
                lg:w-64
                h-[50px]
                rounded-2xl
                border
                border-slate-200
                bg-white
                pl-4
                pr-10
                text-sm
                font-medium
                text-slate-700
                shadow-sm
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="">
                All Flocks
              </option>

              {flocks.map((flock) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.flock_name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />
          </div>

          <div className="flex-shrink-0">
            <ReportFilter
              value={dateRangeSelection}
              onChange={setDateRangeSelection}
            />
          </div>

        </div>

        {/* Active Flock Indicator */}
        {selectedFlockId && (
          <div className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-blue-100
            bg-blue-50
            px-4
            py-3
          ">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Viewing Flock
              </p>

              <p className="mt-0.5 font-bold text-blue-900">
                {
                  flocks.find(
                    (flock) =>
                      flock.id ===
                      selectedFlockId
                  )?.flock_name ||
                  "Selected Flock"
                }
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedFlockId("")
              }
              className="
                text-sm
                font-semibold
                text-blue-700
                hover:text-blue-900
              "
            >
              Clear
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}
          <div className="lg:col-span-4 lg:order-last">

            <div className="lg:sticky lg:top-20 space-y-4">

              <AddMortalityForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>

          </div>

          {/* Records List */}
          <div className="lg:col-span-8 lg:order-first">

            <MortalityList
              records={paginatedRecords}
              onEdit={handleEditRecord}
            />

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

                <EditMortalityForm
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