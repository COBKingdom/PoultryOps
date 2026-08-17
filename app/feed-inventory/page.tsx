"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import { useFeed } from "@/hooks/useFeed";

import { useEffect, useMemo, useState } from "react";

import {
  DateRangeSelection,
  getDateRange,
  getDefaultDateRangeSelection,
} from "@/lib/date-ranges";

import { canEdit } from "@/lib/permissions/governance";

import { Package } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddFeedStockForm from "@/components/feed-inventory/add-feed-stock-form";
import FeedStockList from "@/components/feed-inventory/feed-stock-list";
import FeedStockSummary from "@/components/feed-inventory/feed-stock-summary";
import EditFeedStockForm from "@/components/feed-inventory/edit-feed-stock-form";

export default function FeedInventoryPage() {
  const { user, profile } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId = data?.farm?.id;

  const {
    records: inventoryRecords,
    refresh,
  } = useFeedInventory(farmId);

  const {
    records: feedRecords,
  } = useFeed(farmId);

  const [searchQuery, setSearchQuery] =
    useState("");

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

  const dateRange = dateRangeSelection.range;

  const dateFilteredInventoryRecords = useMemo(() => {
    return inventoryRecords.filter((record) => {
      const recordDate =
        record.purchase_date;

      if (!recordDate) return false;

      return (
        recordDate >= dateRange.start &&
        recordDate <= dateRange.end
      );
    });
  }, [
    inventoryRecords,
    dateRange,
  ]);

  const dateFilteredFeedRecords = useMemo(() => {
    return feedRecords.filter((record) => {
      const recordDate =
        record.feed_date;

      if (!recordDate) return false;

      return (
        recordDate >= dateRange.start &&
        recordDate <= dateRange.end
      );
    });
  }, [
    feedRecords,
    dateRange,
  ]);

  /*
   * ---------------------------------------------------------
   * KPI VALUES
   * ---------------------------------------------------------
   */

  const kpiValues = useMemo(() => {
    const totalPurchased =
      dateFilteredInventoryRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.quantity_kg || 0),
        0
      );

    const totalConsumed =
      dateFilteredFeedRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.quantity_kg || 0),
        0
      );

    const totalRemaining =
      totalPurchased -
      totalConsumed;

    return {
      totalPurchased,
      totalConsumed,
      totalRemaining,
    };
  }, [
    dateFilteredInventoryRecords,
    dateFilteredFeedRecords,
  ]);

  /*
   * ---------------------------------------------------------
   * SEARCH FILTER
   * ---------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateFilteredInventoryRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return dateFilteredInventoryRecords.filter(
      (record) =>
        record.flocks?.flock_name
          ?.toLowerCase()
          .includes(query) ||
        record.feed_type
          ?.toLowerCase()
          .includes(query) ||
        String(record.quantity_kg)
          .includes(query)
    );
  }, [
    dateFilteredInventoryRecords,
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
   * Reset pagination whenever
   * search or date range changes.
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
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
        label="Purchased"
        value={kpiValues.totalPurchased}
        sublabel="kg"
        icon={<Package size={20} />}
        valueColor="blue"
        iconBg="blue"
      />

      <OperationsKpiCard
        label="Consumed"
        value={kpiValues.totalConsumed}
        sublabel="kg"
        icon={<Package size={20} />}
        valueColor="green"
        iconBg="green"
      />

      <OperationsKpiCard
        label="Remaining"
        value={kpiValues.totalRemaining}
        sublabel="kg"
        icon={<Package size={20} />}
        valueColor="blue"
        iconBg="blue"
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
      searchPlaceholder="Search inventory records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <ReportFilter
        value={dateRangeSelection}
        onChange={setDateRangeSelection}
      />
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
    <AppShell email={user?.email}>
      <div className="space-y-6">

        {/* Page Title */}

        <h1 className="text-2xl font-bold text-slate-900">
          Feed Inventory
        </h1>

        {/* KPI Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards}
        </div>

        {/* Filter / Search Toolbar */}

        <div className="flex items-center justify-between">
          {toolbar}
        </div>

        {/* Detailed Feed Stock Summary */}

        <FeedStockSummary
          inventoryRecords={
            dateFilteredInventoryRecords
          }
          feedRecords={
            dateFilteredFeedRecords
          }
        />

        {/* Main content */}

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}

          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">

              <AddFeedStockForm
                farmId={farmId}
              />

            </div>
          </div>

          {/* Records List */}

          <div className="lg:col-span-8 lg:order-first">

            <FeedStockList
              records={paginatedRecords}
              onEdit={handleEditRecord}
              currency={data?.farm?.currency}
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

                <EditFeedStockForm
                  record={editingRecord}
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