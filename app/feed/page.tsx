"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useFeed } from "@/hooks/useFeed";

import { getFarmFlocks } from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import AppShell from "@/components/layout/app-shell";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddFeedForm from "@/components/feed/add-feed-form";
import FeedList from "@/components/feed/feed-list";
import FeedSummary from "@/components/feed/feed-summary";
import EditFeedForm from "@/components/feed/edit-feed-form";

export default function FeedPage() {
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
  } = useFeed(farmId);

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
  ] = useState<DateRangeSelection>(
    getDefaultDateRangeSelection()
  );

  const [
    isEditModalOpen,
    setIsEditModalOpen,
  ] = useState(false);

  const [
    editingRecord,
    setEditingRecord,
  ] = useState<any | null>(null);

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
   * Filter by selected date range.
   */
  const dateFilteredRecords = useMemo(() => {
    const {
      start,
      end,
    } = dateRangeSelection.range;

    return records.filter((record) => {
      const feedDate =
        record.feed_date;

      if (!feedDate) return false;

      return (
        feedDate >= start &&
        feedDate <= end
      );
    });
  }, [
    records,
    dateRangeSelection,
  ]);

  /*
   * Filter by flock.
   */
  const flockFilteredRecords = useMemo(() => {
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
   * Apply search after date and flock filters.
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
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.feed_type
          ?.toLowerCase()
          .includes(query) ||
        record.feed_date
          ?.toLowerCase()
          .includes(query) ||
        String(
          record.quantity_kg
        ).includes(query)
    );
  }, [
    flockFilteredRecords,
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
   * search, flock or date range changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedFlockId,
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
   * Search toolbar.
   */
  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search feed records..."
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Feed Management
          </h1>

          <p className="text-slate-500 mt-1">
            Monitor feed consumption by flock.
          </p>
        </div>

        {/* KPI Summary */}
        <FeedSummary
          records={flockFilteredRecords}
        />

        {/* Search + Flock + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          <div className="flex-1">
            {toolbar}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Flock Filter */}
            <select
              value={selectedFlockId}
              onChange={(e) =>
                setSelectedFlockId(
                  e.target.value
                )
              }
              className="
                w-full
                sm:w-56
                border
                border-slate-200
                bg-white
                rounded-xl
                px-4
                py-3
                text-sm
                text-slate-700
                shadow-sm
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
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

            {/* Date Filter */}
            <ReportFilter
              value={dateRangeSelection}
              onChange={
                setDateRangeSelection
              }
            />

          </div>
        </div>

        {/* Selected Flock Indicator */}
        {selectedFlockId && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              Showing feed records for:
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}
          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">

              <AddFeedForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>
          </div>

          {/* Records List */}
          <div className="lg:col-span-8 lg:order-first">

            <FeedList
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

                <EditFeedForm
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