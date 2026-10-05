"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useFlocks } from "@/hooks/useFlocks";
import { useIsolation } from "@/hooks/useIsolation";

import AppShell from "@/components/layout/app-shell";

import AddIsolationForm from "@/components/isolation/add-isolation-form";
import IsolationList from "@/components/isolation/isolation-list";

import ReportFilter from "@/components/reports/report-filter";

import {
  recordIsolationDeath,
  recordIsolationRecovery,
} from "@/lib/isolation";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import {
  Activity,
  Bird,
  CheckCircle2,
  Skull,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

export default function IsolationPage() {
  const { user } = useAuth();

  const {
    farm,
    loading: farmLoading,
    error: farmError,
    retry: retryFarm,
  } = useCurrentFarm();

  const farmId = farm?.id;

  const {
    flocks,
    loading: flocksLoading,
    error: flocksError,
    refresh: refreshFlocks,
  } = useFlocks(farmId);

  const {
    records,
    loading: isolationLoading,
    error: isolationError,
    refresh: refreshIsolation,
  } = useIsolation(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFlockId, setSelectedFlockId] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [
    dateRangeSelection,
    setDateRangeSelection,
  ] = useState<DateRangeSelection>(
    getDefaultDateRangeSelection()
  );

  const isLoading =
    farmLoading ||
    flocksLoading ||
    isolationLoading;

  /*
   * =========================================================
   * DATE FILTER
   * =========================================================
   *
   * Isolation uses isolation_date.
   */

  const dateFilteredRecords = useMemo(() => {
    const {
      start,
      end,
    } = dateRangeSelection.range;

    return records.filter((record) => {
      const isolationDate =
        record.isolation_date;

      if (!isolationDate) {
        return false;
      }

      return (
        isolationDate >= start &&
        isolationDate <= end
      );
    });
  }, [
    records,
    dateRangeSelection,
  ]);

  /*
   * =========================================================
   * FLOCK FILTER
   * =========================================================
   *
   * All Flocks is represented by an empty selectedFlockId.
   */

  const flockFilteredRecords =
    useMemo(() => {
      if (!selectedFlockId) {
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
   * =========================================================
   * KPI VALUES
   * =========================================================
   *
   * These calculations are unchanged from the existing
   * Isolation implementation. The only difference is that
   * they now operate on the selected flock when one is chosen.
   */

  const kpiValues = useMemo(() => {
    const activeRecords =
      flockFilteredRecords.filter(
        (record) =>
          record.status === "active"
      );

    const currentlyIsolated =
      activeRecords.reduce(
        (sum, record) =>
          sum +
          Math.max(
            0,
            Number(
              record.quantity || 0
            ) -
              Number(
                record.returned_quantity ||
                  0
              ) -
              Number(
                record.deceased_quantity ||
                  0
              )
          ),
        0
      );

    const activeCases =
      activeRecords.length;

    const recoveredBirds =
      flockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.returned_quantity ||
              0
          ),
        0
      );

    const deceasedBirds =
      flockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.deceased_quantity ||
              0
          ),
        0
      );

    return {
      currentlyIsolated,
      activeCases,
      recoveredBirds,
      deceasedBirds,
    };
  }, [
    flockFilteredRecords,
  ]);

  /*
   * =========================================================
   * SEARCH FILTER
   * =========================================================
   *
   * Search is deliberately applied after date + flock filters.
   */

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return flockFilteredRecords;
    }

    const query =
      searchQuery
        .toLowerCase()
        .trim();

    return flockFilteredRecords.filter(
      (record) => {
        const flockName =
          record.flocks
            ?.flock_name
            ?.toLowerCase() || "";

        const birdType =
          record.flocks
            ?.bird_type
            ?.toLowerCase() || "";

        const reason =
          record.reason
            ?.toLowerCase() || "";

        const status =
          record.status
            ?.toLowerCase() || "";

        return (
          flockName.includes(query) ||
          birdType.includes(query) ||
          reason.includes(query) ||
          status.includes(query)
        );
      }
    );
  }, [
    flockFilteredRecords,
    searchQuery,
  ]);

  /*
   * =========================================================
   * RESET SEARCH-RELATED DISPLAY
   * =========================================================
   *
   * We intentionally keep the search term intact.
   * Records recalculate automatically when the filters change.
   */

  useEffect(() => {
    // No additional state reset required.
  }, [
    dateRangeSelection,
    selectedFlockId,
  ]);

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function refreshAll() {
    await Promise.all([
      refreshIsolation(),
      refreshFlocks(),
    ]);
  }

  /*
   * =========================================================
   * RECOVER BIRDS
   * =========================================================
   */

  async function handleRecover(
    record: any
  ) {
    const remaining =
      Math.max(
        0,
        Number(
          record.quantity || 0
        ) -
          Number(
            record.returned_quantity ||
              0
          ) -
          Number(
            record.deceased_quantity ||
              0
          )
      );

    if (remaining <= 0) {
      return;
    }

    const value =
      window.prompt(
        `How many birds from ${
          record.flocks?.flock_name ||
          "this flock"
        } have recovered and should be returned? Maximum: ${remaining}`,
        String(remaining)
      );

    if (value === null) {
      return;
    }

    const quantity =
      Number(value);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > remaining
    ) {
      alert(
        `Please enter a whole number between 1 and ${remaining}.`
      );

      return;
    }

    try {
      setActionLoading(true);

      await recordIsolationRecovery(
        record.id,
        quantity
      );

      await refreshAll();
    } catch (error: any) {
      console.error(
        "Failed to record recovery:",
        error
      );

      alert(
        error?.message ||
          "Failed to record recovered birds."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * =========================================================
   * RECORD ISOLATION DEATH
   * =========================================================
   */

  async function handleDeath(
    record: any
  ) {
    const remaining =
      Math.max(
        0,
        Number(
          record.quantity || 0
        ) -
          Number(
            record.returned_quantity ||
              0
          ) -
          Number(
            record.deceased_quantity ||
              0
          )
      );

    if (remaining <= 0) {
      return;
    }

    const value =
      window.prompt(
        `How many isolated birds died? Maximum: ${remaining}`,
        String(remaining)
      );

    if (value === null) {
      return;
    }

    const quantity =
      Number(value);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > remaining
    ) {
      alert(
        `Please enter a whole number between 1 and ${remaining}.`
      );

      return;
    }

    try {
      setActionLoading(true);

      await recordIsolationDeath(
        record.id,
        quantity
      );

      await refreshAll();
    } catch (error: any) {
      console.error(
        "Failed to record isolation death:",
        error
      );

      alert(
        error?.message ||
          "Failed to record deceased birds."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * =========================================================
   * LOADING STATE
   * =========================================================
   */

  if (isLoading) {
    return (
      <AppShell
        email={user?.email}
      >
        <div className="space-y-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
              <div className="h-5 w-72 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]"
                >
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

                  <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-3" />

                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              )
            )}
          </div>

          <div className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse" />

          <div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />

        </div>
      </AppShell>
    );
  }

  /*
   * =========================================================
   * ERROR STATE
   * =========================================================
   */

  if (
    farmError ||
    flocksError ||
    isolationError
  ) {
    return (
      <AppShell
        email={user?.email}
      >
        <div className="flex items-center justify-center h-96">

          <div className="text-center max-w-md">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Activity
                className="text-red-600"
                size={32}
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Unable to Load Isolation
            </h2>

            <p className="text-slate-500 mb-6">
              We couldn't load the isolation
              records. Please refresh the page
              and try again.
            </p>

            <button
              onClick={() => {
                retryFarm();
                refreshFlocks();
                refreshIsolation();
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

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* =====================================================
            PAGE HEADER
            ===================================================== */}

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Isolation
          </h1>

          <p className="text-slate-500 mt-1">
            Manage sick and vulnerable birds
            removed from their flocks for
            observation and treatment.
          </p>
        </div>

        {/* =====================================================
            OPERATIONAL KPI CARDS
            Same visual treatment as Feed / Sales / Expenses
            ===================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Currently Isolated */}

          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="flex items-start justify-between gap-3 pt-1">

              <div className="min-w-0">

                <div className="text-sm font-medium text-slate-500">
                  Currently Isolated
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {kpiValues.currentlyIsolated.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Birds currently isolated
                </div>

              </div>

              <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />

            </div>
          </div>

          {/* Active Cases */}

          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="flex items-start justify-between gap-3 pt-1">

              <div className="min-w-0">

                <div className="text-sm font-medium text-slate-500">
                  Active Cases
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {kpiValues.activeCases.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Active isolation records
                </div>

              </div>

              <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />

            </div>
          </div>

          {/* Returned */}

          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="flex items-start justify-between gap-3 pt-1">

              <div className="min-w-0">

                <div className="text-sm font-medium text-slate-500">
                  Returned
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {kpiValues.recoveredBirds.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Birds recovered
                </div>

              </div>

              <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />

            </div>
          </div>

          {/* Deaths */}

          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="flex items-start justify-between gap-3 pt-1">

              <div className="min-w-0">

                <div className="text-sm font-medium text-slate-500">
                  Deaths
                </div>

                <div className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                  {kpiValues.deceasedBirds.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Birds lost in isolation
                </div>

              </div>

              <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />

            </div>
          </div>

        </div>

        {/* =====================================================
            SEARCH + FLOCK + DATE FILTER
            ===================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          {/* Search */}

          <div className="flex-1">

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                placeholder="Search flock, reason or status..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />

            </div>

          </div>

          {/* Flock + Date */}

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Flock Filter */}

            <div className="relative flex-shrink-0">

              <select
                value={selectedFlockId}
                onChange={(e) =>
                  setSelectedFlockId(
                    e.target.value
                  )
                }
                className="
                  appearance-none
                  w-full
                  sm:w-56
                  border
                  border-slate-200
                  bg-white
                  rounded-xl
                  px-4
                  py-3
                  pr-10
                  text-sm
                  text-slate-700
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                aria-label="Filter isolation records by flock"
              >

                <option value="">
                  All Flocks
                </option>

                {flocks.map(
                  (flock) => (
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

        </div>

        {/* =====================================================
            SELECTED FLOCK INDICATOR
            ===================================================== */}

        {selectedFlockId && (
          <div className="flex items-center gap-2">

            <span className="text-sm text-slate-500">
              Showing isolation records for:
            </span>

            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">

              {
                flocks.find(
                  (flock) =>
                    flock.id ===
                    selectedFlockId
                )?.flock_name ||
                  "Selected Flock"
              }

            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedFlockId("")
              }
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>

          </div>
        )}

        {/* =====================================================
            MAIN CONTENT
            ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Records */}

          <div className="lg:col-span-8">

            <div className="mb-4">

              <h2 className="text-2xl font-bold text-slate-900">
                Isolation Records
              </h2>

              <p className="text-slate-500 mt-1">
                Track birds currently isolated
                and their eventual outcome.
              </p>

            </div>

            <IsolationList
              records={
                filteredRecords
              }
              onRecover={
                actionLoading
                  ? undefined
                  : handleRecover
              }
              onDeath={
                actionLoading
                  ? undefined
                  : handleDeath
              }
            />

          </div>

          {/* Quick Entry */}

          <div className="lg:col-span-4">

            <div className="lg:sticky lg:top-20">

              <AddIsolationForm
                farmId={farmId!}
                flocks={flocks}
                onSaved={refreshAll}
              />

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}