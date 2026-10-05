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
  AlertTriangle,
  ChevronDown,
  HeartPulse,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

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

  const [
    dateRangeSelection,
    setDateRangeSelection,
  ] =
    useState<DateRangeSelection>(
      getDefaultDateRangeSelection()
    );

  const [
    isEditModalOpen,
    setIsEditModalOpen,
  ] = useState(false);

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<any | null>(null);

  // ============================================================
  // LOAD FARM FLOCKS
  // ============================================================

  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) {
        setFlocks([]);
        return;
      }

      try {
        const result =
          await getFarmFlocks(farmId);

        setFlocks(result || []);
      } catch (error) {
        console.error(
          "Failed to load farm flocks:",
          error
        );

        setFlocks([]);
      }
    }

    loadFlocks();
  }, [farmId]);

  // ============================================================
  // DATE + FLOCK FILTER
  // ============================================================

  const dateAndFlockFilteredRecords =
    useMemo(() => {
      const {
        start,
        end,
      } =
        dateRangeSelection.range;

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

  // ============================================================
  // OPERATIONAL KPI VALUES
  // ============================================================

  const kpiValues = useMemo(() => {
    const selectedPeriodMortality =
      dateAndFlockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.quantity || 0
          ),
        0
      );

    const recordCount =
      dateAndFlockFilteredRecords.length;

    const selectedFlocks =
      selectedFlockId
        ? flocks.filter(
            (flock) =>
              flock.id ===
              selectedFlockId
          )
        : flocks;

    const startingBirds =
      selectedFlocks.reduce(
        (sum, flock) =>
          sum +
          Number(
            flock.quantity || 0
          ),
        0
      );

    const mortalityRate =
      startingBirds > 0
        ? (
            selectedPeriodMortality /
            startingBirds
          ) * 100
        : 0;

    let mortalityStatus:
      | "normal"
      | "watch"
      | "critical";

    if (mortalityRate >= 10) {
      mortalityStatus =
        "critical";
    } else if (
      mortalityRate >= 5
    ) {
      mortalityStatus =
        "watch";
    } else {
      mortalityStatus =
        "normal";
    }

    return {
      selectedPeriodMortality,
      recordCount,
      startingBirds,
      mortalityRate,
      mortalityStatus,
    };
  }, [
    dateAndFlockFilteredRecords,
    flocks,
    selectedFlockId,
  ]);

  // ============================================================
  // MORTALITY STATUS
  // ============================================================

  const mortalityStatusConfig =
    useMemo(() => {
      if (
        kpiValues.mortalityStatus ===
        "critical"
      ) {
        return {
          label: "Critical",
          description:
            "Mortality is at or above the 10% threshold.",
          valueClass:
            "text-red-600",
          dotClass:
            "bg-red-500 ring-red-100",
          bannerClass:
            "border-red-200 bg-red-50",
          bannerIconClass:
            "text-red-600",
          bannerTitleClass:
            "text-red-900",
          bannerTextClass:
            "text-red-700",
        };
      }

      if (
        kpiValues.mortalityStatus ===
        "watch"
      ) {
        return {
          label: "Watch",
          description:
            "Mortality is elevated and should be monitored.",
          valueClass:
            "text-amber-600",
          dotClass:
            "bg-amber-500 ring-amber-100",
          bannerClass:
            "border-amber-200 bg-amber-50",
          bannerIconClass:
            "text-amber-600",
          bannerTitleClass:
            "text-amber-900",
          bannerTextClass:
            "text-amber-700",
        };
      }

      return {
        label: "Normal",
        description:
          "Mortality is currently below the watch threshold.",
        valueClass:
          "text-green-600",
        dotClass:
          "bg-emerald-500 ring-emerald-100",
        bannerClass:
          "border-green-200 bg-green-50",
        bannerIconClass:
          "text-green-600",
        bannerTitleClass:
          "text-green-900",
        bannerTextClass:
          "text-green-700",
      };
    }, [
      kpiValues.mortalityStatus,
    ]);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredRecords =
    useMemo(() => {
      if (!searchQuery.trim()) {
        return dateAndFlockFilteredRecords;
      }

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return dateAndFlockFilteredRecords.filter(
        (record) =>
          record.flocks?.flock_name
            ?.toLowerCase()
            .includes(query) ||
          record.mortality_date
            ?.toLowerCase()
            .includes(query) ||
          String(
            record.quantity
          ).includes(query) ||
          record.reason
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      dateAndFlockFilteredRecords,
      searchQuery,
    ]);

  // ============================================================
  // PAGINATION
  // ============================================================

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

  // ============================================================
  // RESET PAGINATION
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedFlockId,
    dateRangeSelection,
  ]);

  // ============================================================
  // EDIT GOVERNANCE
  // ============================================================

  function handleEditRecord(
    record: any
  ) {
    const governanceResult =
      canEdit(
        {
          id:
            user?.id || "",
          role:
            profile?.role || "",
        },
        record
      );

    if (
      !governanceResult.allowed
    ) {
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

  // ============================================================
  // OPERATIONAL KPI CARDS
  //
  // Uses the same blue top-line + shadow treatment used
  // by the other upgraded operational modules.
  // ============================================================

  const kpiCards = (
    <>
      {/* Birds Lost */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Birds Lost
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-red-600">
              {kpiValues.selectedPeriodMortality.toLocaleString()}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Selected period
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />
        </div>
      </div>

      {/* Mortality Rate */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Mortality Rate
            </div>

            <div className="mt-2 flex items-baseline font-bold tracking-tight">
              <span
                className={`text-3xl ${mortalityStatusConfig.valueClass}`}
              >
                {kpiValues.mortalityRate.toFixed(
                  2
                )}
              </span>

              <span
                className={`ml-1 text-2xl ${mortalityStatusConfig.valueClass}`}
              >
                %
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {mortalityStatusConfig.label}
            </div>
          </div>

          <div
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${mortalityStatusConfig.dotClass}`}
          />
        </div>
      </div>

      {/* Records */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Records
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {kpiValues.recordCount.toLocaleString()}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Selected period
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        </div>
      </div>

      {/* Starting Birds */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Starting Birds
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-green-600">
              {kpiValues.startingBirds.toLocaleString()}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {selectedFlockId
                ? "Selected flock"
                : "All flocks"}
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
      </div>
    </>
  );

  // ============================================================
  // TOOLBAR / FILTERS
  // ============================================================

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search mortality records..."
      searchValue={searchQuery}
      onSearchChange={
        setSearchQuery
      }
    />
  );

  // ============================================================
  // PAGINATION
  // ============================================================

  const pagination = (
    <OperationsPagination
      current={currentPage}
      total={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={
        setCurrentPage
      }
    />
  );

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900">
          Mortality Management
        </h1>

        {/* ======================================================
            OPERATIONAL KPI CARDS
            ====================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards}
        </div>

        {/* ======================================================
            MORTALITY STATUS / WARNING
            ====================================================== */}

        <div
          className={`
            flex
            items-start
            gap-3
            rounded-2xl
            border
            px-4
            py-4
            ${mortalityStatusConfig.bannerClass}
          `}
        >
          <div
            className={`
              mt-0.5
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              ${mortalityStatusConfig.bannerIconClass}
            `}
          >
            {kpiValues.mortalityStatus ===
            "critical" ? (
              <AlertTriangle
                size={19}
              />
            ) : (
              <HeartPulse
                size={19}
              />
            )}
          </div>

          <div className="min-w-0">
            <p
              className={`
                font-bold
                ${mortalityStatusConfig.bannerTitleClass}
              `}
            >
              Mortality Status:{" "}
              {
                mortalityStatusConfig.label
              }
            </p>

            <p
              className={`
                mt-0.5
                text-sm
                ${mortalityStatusConfig.bannerTextClass}
              `}
            >
              {
                mortalityStatusConfig.description
              }
            </p>

            {kpiValues.mortalityStatus ===
              "critical" && (
              <p
                className={`
                  mt-1
                  text-sm
                  font-semibold
                  ${mortalityStatusConfig.bannerTextClass}
                `}
              >
                Immediate investigation is recommended.
              </p>
            )}
          </div>
        </div>

        {/* ======================================================
            FILTERS
            ====================================================== */}

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
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                pr-10
                text-sm
                text-slate-700
                shadow-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              aria-label="Filter mortality records by flock"
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

          {/* Date Filter */}
          <div className="flex-shrink-0">
            <ReportFilter
              value={
                dateRangeSelection
              }
              onChange={
                setDateRangeSelection
              }
            />
          </div>
        </div>

        {/* Active Flock Indicator */}
        {selectedFlockId && (
          <div
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-blue-100
              bg-blue-50
              px-4
              py-3
            "
          >
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

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

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

          {/* Mortality Records */}
          <div className="lg:col-span-8 lg:order-first">

            <MortalityList
              records={
                paginatedRecords
              }
              onEdit={
                handleEditRecord
              }
            />

          </div>
        </div>

        {/* ======================================================
            PAGINATION
            ====================================================== */}

        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

        {/* ======================================================
            EDIT MODAL
            ====================================================== */}

        {isEditModalOpen &&
          editingRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

                <EditMortalityForm
                  record={
                    editingRecord
                  }
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