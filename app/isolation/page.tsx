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

  const [actionLoading, setActionLoading] =
    useState(false);

  const [dateRangeSelection, setDateRangeSelection] =
    useState<DateRangeSelection>(
      getDefaultDateRangeSelection()
    );

  const isLoading =
    farmLoading ||
    flocksLoading ||
    isolationLoading;

  /*
   * Filter records by the selected date range.
   *
   * Isolation uses isolation_date as its date column.
   */
  const dateFilteredRecords = useMemo(() => {
    const { start, end } =
      dateRangeSelection.range;

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
  }, [records, dateRangeSelection]);

  /*
   * KPI values are calculated from
   * the selected date range.
   */
  const kpiValues = useMemo(() => {
    const activeRecords =
      dateFilteredRecords.filter(
        (record) =>
          record.status === "active"
      );

    const currentlyIsolated =
      activeRecords.reduce(
        (sum, record) =>
          sum +
          Math.max(
            0,
            Number(record.quantity || 0) -
              Number(
                record.returned_quantity || 0
              ) -
              Number(
                record.deceased_quantity || 0
              )
          ),
        0
      );

    const activeCases =
      activeRecords.length;

    const recoveredBirds =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.returned_quantity || 0
          ),
        0
      );

    const deceasedBirds =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.deceased_quantity || 0
          ),
        0
      );

    return {
      currentlyIsolated,
      activeCases,
      recoveredBirds,
      deceasedBirds,
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
    dateFilteredRecords,
    searchQuery,
  ]);

  /*
   * Reset search-related state when
   * the date range changes.
   */
  useEffect(() => {
    // Keep the user's search term intact.
    // The displayed records automatically
    // recalculate from the new date range.
  }, [dateRangeSelection]);

  async function refreshAll() {
    await Promise.all([
      refreshIsolation(),
      refreshFlocks(),
    ]);
  }

  async function handleRecover(
    record: any
  ) {
    const remaining =
      Math.max(
        0,
        Number(record.quantity || 0) -
          Number(
            record.returned_quantity || 0
          ) -
          Number(
            record.deceased_quantity || 0
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

  async function handleDeath(
    record: any
  ) {
    const remaining =
      Math.max(
        0,
        Number(record.quantity || 0) -
          Number(
            record.returned_quantity || 0
          ) -
          Number(
            record.deceased_quantity || 0
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

  if (isLoading) {
    return (
      <AppShell email={user?.email}>
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
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

  if (
    farmError ||
    flocksError ||
    isolationError
  ) {
    return (
      <AppShell email={user?.email}>
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

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">

        {/* Header */}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Bird
                className="text-amber-600"
                size={18}
              />

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Currently Isolated
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {kpiValues.currentlyIsolated.toLocaleString()}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              birds
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity
                className="text-blue-600"
                size={18}
              />

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Active Cases
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {kpiValues.activeCases.toLocaleString()}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              isolation records
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2
                className="text-green-600"
                size={18}
              />

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Returned
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {kpiValues.recoveredBirds.toLocaleString()}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              birds recovered
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Skull
                className="text-red-600"
                size={18}
              />

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Deaths
              </p>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {kpiValues.deceasedBirds.toLocaleString()}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              birds lost in isolation
            </p>
          </div>

        </div>

        {/* Search + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

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

          <div className="flex-shrink-0">
            <ReportFilter
              value={dateRangeSelection}
              onChange={
                setDateRangeSelection
              }
            />
          </div>

        </div>

        {/* Record Isolation */}
        <AddIsolationForm
          farmId={farmId!}
          flocks={flocks}
          onSaved={refreshAll}
        />

        {/* Isolation Records */}
        <div>
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
            records={filteredRecords}
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

      </div>
    </AppShell>
  );
}