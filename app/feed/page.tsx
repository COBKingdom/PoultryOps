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
  } = useFeed(
    farmId
  );

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
        await getFarmFlocks(
          farmId
        );

      setFlocks(result);
    }

    load();
  }, [farmId]);

  /*
   * Filter feed records by selected date range.
   *
   * Feed records use feed_date.
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
        record.feed_type
          ?.toLowerCase()
          .includes(query) ||
        record.feed_date
          ?.toLowerCase()
          .includes(query) ||
        String(record.quantity_kg)
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
        <h1 className="text-2xl font-bold text-slate-900">
          Feed Management
        </h1>

        {/* KPI Summary */}
        <FeedSummary
          records={dateFilteredRecords}
        />

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