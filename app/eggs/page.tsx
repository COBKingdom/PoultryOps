"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useEggProduction } from "@/hooks/useEggProduction";

import {
  getFarmFlocks,
  getAvailableBirds,
  getFlockAvailableBirds,
} from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import {
  Egg,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

import OperationsKpiCard from "@/components/operations/operations-kpi-card";
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

  const [availableBirds, setAvailableBirds] =
    useState(0);

  const [availableBirdsLoading, setAvailableBirdsLoading] =
    useState(false);

  const {
    records,
    loading: recordsLoading,
    refresh,
  } = useEggProduction(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFlockId, setSelectedFlockId] =
    useState("all");

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

      try {
        const result =
          await getFarmFlocks(farmId);

        setFlocks(result || []);
      } catch (error) {
        console.error(
          "Failed to load flocks:",
          error
        );
      }
    }

    load();
  }, [farmId]);

  /*
   * Load available birds for the current
   * Egg Production context.
   *
   * All Flocks:
   *   Uses farm-wide available birds.
   *
   * Specific flock:
   *   Uses the existing flock-level
   *   Available Birds calculation.
   *
   * This does not alter any existing
   * flock or dashboard calculations.
   */
  useEffect(() => {
    async function loadAvailableBirds() {
      if (!farmId) {
        setAvailableBirds(0);
        return;
      }

      setAvailableBirdsLoading(true);

      try {
        const value =
          selectedFlockId === "all"
            ? await getAvailableBirds(farmId)
            : await getFlockAvailableBirds(
                selectedFlockId
              );

        setAvailableBirds(
          Math.max(0, Number(value) || 0)
        );
      } catch (error) {
        console.error(
          "Failed to load available birds:",
          error
        );

        setAvailableBirds(0);
      } finally {
        setAvailableBirdsLoading(false);
      }
    }

    loadAvailableBirds();
  }, [farmId, selectedFlockId]);

  /*
   * Apply date range + flock filter.
   *
   * These filters are applied before search
   * and pagination so that KPI figures remain
   * consistent with the records being viewed.
   */
  const dateAndFlockFilteredRecords =
    useMemo(() => {
      const {
        start,
        end,
      } = dateRangeSelection.range;

      return records.filter((record) => {
        const productionDate =
          record.production_date;

        if (!productionDate) {
          return false;
        }

        const matchesDate =
          productionDate >= start &&
          productionDate <= end;

        const matchesFlock =
          selectedFlockId === "all" ||
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
   * Apply search after date + flock filters.
   */
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateAndFlockFilteredRecords;
    }

    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return dateAndFlockFilteredRecords.filter(
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.production_date
          ?.toLowerCase()
          .includes(query) ||
        String(
          record.egg_count
        ).includes(query) ||
        String(
          record.cracked_eggs
        ).includes(query)
    );
  }, [
    dateAndFlockFilteredRecords,
    searchQuery,
  ]);

  /*
   * KPI values.
   *
   * Eggs Collected = all eggs recorded
   * in the selected period and flock.
   *
   * Good Eggs = Eggs Collected - Cracked Eggs.
   */
  const kpiValues = useMemo(() => {
    const eggsCollected =
      dateAndFlockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.egg_count || 0
          ),
        0
      );

    const crackedEggs =
      dateAndFlockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(
            record.cracked_eggs || 0
          ),
        0
      );

    const goodEggs =
      Math.max(
        0,
        eggsCollected -
          crackedEggs
      );

    const recordCount =
      dateAndFlockFilteredRecords.length;

    return {
      eggsCollected,
      goodEggs,
      crackedEggs,
      recordCount,
    };
  }, [
    dateAndFlockFilteredRecords,
  ]);

  /*
   * Production performance.
   *
   * Production Rate =
   * Eggs Collected / Available Birds × 100
   *
   * The rate uses the same selected
   * period + flock context as the
   * Egg Production KPIs.
   */
  const performance = useMemo(() => {
    const eggsCollected =
      Number(kpiValues.eggsCollected) || 0;

    const crackedEggs =
      Number(kpiValues.crackedEggs) || 0;

    const birds =
      Math.max(
        0,
        Number(availableBirds) || 0
      );

    const productionRate =
      birds > 0
        ? (eggsCollected / birds) * 100
        : 0;

    const crackedRate =
      eggsCollected > 0
        ? (crackedEggs / eggsCollected) * 100
        : 0;

    return {
      eggsCollected,
      crackedEggs,
      birds,
      productionRate,
      crackedRate,
    };
  }, [
    kpiValues,
    availableBirds,
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
   * search or filters change.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    dateRangeSelection,
    selectedFlockId,
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

        {/* Production Performance */}
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* Performance heading */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <TrendingUp size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Production Performance
                  </h2>

                  <p className="text-xs text-slate-500">
                    Production efficiency for the selected period
                  </p>
                </div>
              </div>
            </div>

            {/* Production rate */}
            <div className="lg:min-w-[220px] lg:text-right">
              <div className="flex items-end justify-between lg:justify-end lg:gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Production Rate
                </span>

                <span className="text-2xl font-bold text-slate-900">
                  {availableBirdsLoading
                    ? "—"
                    : `${performance.productionRate.toFixed(1)}%`}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        performance.productionRate
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Performance context */}
          <div
            className="
              mt-5
              flex
              flex-col
              gap-3
              border-t
              border-slate-100
              pt-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
                Available Birds
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {availableBirdsLoading
                  ? "—"
                  : performance.birds.toLocaleString()}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
                Cracked Rate
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {performance.crackedRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

  {/* Eggs Collected */}
  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
    <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

    <div className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-500">
          Eggs Collected
        </div>

        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {kpiValues.eggsCollected}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          Selected period
        </div>
      </div>

      <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
    </div>
  </div>

  {/* Records */}
  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
    <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

    <div className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-500">
          Records
        </div>

        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {kpiValues.recordCount}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          Production records
        </div>
      </div>

      <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />
    </div>
  </div>

  {/* Good Eggs */}
  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
    <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

    <div className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-500">
          Good Eggs
        </div>

        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {kpiValues.goodEggs}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          After cracked eggs
        </div>
      </div>

      <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
    </div>
  </div>

  {/* Cracked Eggs */}
  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
    <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

    <div className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-500">
          Cracked Eggs
        </div>

        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {kpiValues.crackedEggs}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          Selected period
        </div>
      </div>

      <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
    </div>
  </div>

</div>
        {/* Search + Flock + Date Filters */}
        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            gap-3
          "
        >

          {/* Search */}
          <div className="relative flex-1">

            <Search
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
                pointer-events-none
              "
            />

            <input
              type="text"
              placeholder="Search production records..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                py-3
                pl-11
                pr-4
                text-sm
                text-slate-900
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            />

          </div>

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
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                py-3
                pl-4
                pr-10
                text-sm
                font-medium
                text-slate-700
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">
                All Flocks
              </option>

              {flocks.map(
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
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-slate-400
                pointer-events-none
              "
            />

          </div>

          {/* Existing Date Range Filter */}
          <div className="flex-shrink-0">
            <ReportFilter
              value={dateRangeSelection}
              onChange={
                setDateRangeSelection
              }
            />
          </div>

        </div>

        {/* Main Content */}
        <div
          className="
            grid
            lg:grid-cols-12
            gap-6
            items-start
          "
        >

          {/* Quick Entry */}
          <div
            className="
              lg:col-span-4
              lg:order-last
            "
          >

            <div
              className="
                lg:sticky
                lg:top-20
                space-y-4
              "
            >

              <AddEggForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>

          </div>

          {/* Production List */}
          <div
            className="
              lg:col-span-8
              lg:order-first
            "
          >

            {recordsLoading ? (
              <div className="space-y-3">

                {[1, 2, 3].map(
                  (i) => (
                    <div
                      key={i}
                      className="
                        h-16
                        bg-slate-200
                        rounded-xl
                        animate-pulse
                      "
                    />
                  )
                )}

              </div>
            ) : (
              <EggProductionList
                records={
                  paginatedRecords
                }
                onEdit={
                  handleEditRecord
                }
              />
            )}

          </div>

        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div
            className="
              flex
              items-center
              justify-center
              pt-4
            "
          >
            <OperationsPagination
              current={currentPage}
              total={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={
                setCurrentPage
              }
            />
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen &&
          editingRecord && (
            <div
              className="
                fixed
                inset-0
                bg-black/50
                flex
                items-center
                justify-center
                z-50
                p-4
              "
            >

              <div
                className="
                  bg-white
                  rounded-3xl
                  max-w-lg
                  w-full
                  max-h-[90vh]
                  overflow-y-auto
                "
              >

                <EditEggForm
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