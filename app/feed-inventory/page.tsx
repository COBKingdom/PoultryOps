"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import { useFeed } from "@/hooks/useFeed";

import {
  getFarmFlocks,
} from "@/lib/flocks";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import { canEdit } from "@/lib/permissions/governance";

import {
  Package,
  TrendingDown,
  Boxes,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddFeedStockForm from "@/components/feed-inventory/add-feed-stock-form";
import EditFeedStockForm from "@/components/feed-inventory/edit-feed-stock-form";
import FeedStockList from "@/components/feed-inventory/feed-stock-list";
import FeedStockSummary from "@/components/feed-inventory/feed-stock-summary";

export default function FeedInventoryPage() {
  const {
    user,
    profile,
  } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const farmId =
    farm?.id;

  const {
    records,
    loading: inventoryLoading,
    refresh,
  } =
    useFeedInventory(
      farmId
    );

  const {
    records: feedRecords,
  } =
    useFeed(
      farmId
    );

  const [
    flocks,
    setFlocks,
  ] =
    useState<any[]>([]);

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    selectedFlockId,
    setSelectedFlockId,
  ] =
    useState("");

  const [
    currentPage,
    setCurrentPage,
  ] =
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
  ] =
    useState(false);

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<any | null>(
      null
    );

  /*
   * ---------------------------------------------------------
   * LOAD FARM FLOCKS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) {
        setFlocks([]);
        return;
      }

      try {
        const result =
          await getFarmFlocks(
            farmId
          );

        setFlocks(
          result || []
        );
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

  /*
   * ---------------------------------------------------------
   * PURCHASES DURING SELECTED PERIOD
   *
   * This controls:
   * - Purchased KPI
   * - Purchase records shown in the list
   * ---------------------------------------------------------
   */

  const dateFilteredRecords =
    useMemo(() => {
      const {
        start,
        end,
      } =
        dateRangeSelection.range;

      return records.filter(
        (record) => {
          const date =
            record.purchase_date;

          if (!date) {
            return false;
          }

          return (
            date >= start &&
            date <= end
          );
        }
      );
    }, [
      records,
      dateRangeSelection,
    ]);

  /*
   * ---------------------------------------------------------
   * PURCHASES DURING SELECTED FLOCK + PERIOD
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * FEED CONSUMPTION DURING SELECTED PERIOD
   *
   * Consumption comes from the Feed page.
   * ---------------------------------------------------------
   */

  const dateFilteredFeed =
    useMemo(() => {
      const {
        start,
        end,
      } =
        dateRangeSelection.range;

      return feedRecords.filter(
        (record) => {
          const date =
            record.feed_date;

          if (!date) {
            return false;
          }

          return (
            date >= start &&
            date <= end
          );
        }
      );
    }, [
      feedRecords,
      dateRangeSelection,
    ]);

  /*
   * ---------------------------------------------------------
   * CONSUMPTION DURING SELECTED FLOCK + PERIOD
   * ---------------------------------------------------------
   */

  const flockFilteredFeed =
    useMemo(() => {
      if (!selectedFlockId) {
        return dateFilteredFeed;
      }

      return dateFilteredFeed.filter(
        (record) =>
          record.flock_id ===
          selectedFlockId
      );
    }, [
      dateFilteredFeed,
      selectedFlockId,
    ]);

  /*
   * ---------------------------------------------------------
   * ALL-TIME PURCHASES FOR CURRENT STOCK
   *
   * Current Stock deliberately ignores the date filter.
   * When a flock is selected, however, it must only use
   * purchases belonging to that flock.
   * ---------------------------------------------------------
   */

  const flockFilteredAllRecords =
    useMemo(() => {
      if (!selectedFlockId) {
        return records;
      }

      return records.filter(
        (record) =>
          record.flock_id ===
          selectedFlockId
      );
    }, [
      records,
      selectedFlockId,
    ]);

  /*
   * ---------------------------------------------------------
   * ALL-TIME CONSUMPTION FOR CURRENT STOCK
   *
   * When a flock is selected, only consumption belonging
   * to that flock is included.
   * ---------------------------------------------------------
   */

  const flockFilteredAllFeedRecords =
    useMemo(() => {
      if (!selectedFlockId) {
        return feedRecords;
      }

      return feedRecords.filter(
        (record) =>
          record.flock_id ===
          selectedFlockId
      );
    }, [
      feedRecords,
      selectedFlockId,
    ]);

  /*
   * ---------------------------------------------------------
   * KPI VALUES
   *
   * Purchased:
   *   Feed purchased during the selected period.
   *
   * Consumed:
   *   Feed consumed during the selected period.
   *
   * Current Stock:
   *   Actual cumulative stock for the farm or selected flock.
   *
   * Current Stock intentionally ignores the selected
   * date filter.
   *
   * All purchases
   * - All recorded consumption
   * = Current Stock
   * ---------------------------------------------------------
   */

  const kpiValues =
    useMemo(() => {
      const purchased =
        flockFilteredRecords.reduce(
          (
            sum,
            record
          ) =>
            sum +
            Number(
              record.quantity_kg ||
                0
            ),
          0
        );

      const consumed =
        flockFilteredFeed.reduce(
          (
            sum,
            record
          ) =>
            sum +
            Number(
              record.quantity_kg ||
                0
            ),
          0
        );

      /*
       * All-time purchased feed.
       */
      const totalPurchased =
        flockFilteredAllRecords.reduce(
          (
            sum,
            record
          ) =>
            sum +
            Number(
              record.quantity_kg ||
                0
            ),
          0
        );

      /*
       * All-time consumed feed.
       */
      const totalConsumed =
        flockFilteredAllFeedRecords.reduce(
          (
            sum,
            record
          ) =>
            sum +
            Number(
              record.quantity_kg ||
                0
            ),
          0
        );

      /*
       * Actual current stock.
       */
      const currentStock =
        Math.max(
          0,
          totalPurchased -
            totalConsumed
        );

      return {
        purchased,
        consumed,
        currentStock,
      };
    }, [
      flockFilteredRecords,
      flockFilteredFeed,
      flockFilteredAllRecords,
      flockFilteredAllFeedRecords,
    ]);

  /*
   * ---------------------------------------------------------
   * SEARCH PURCHASE RECORDS
   *
   * Search is applied after date and flock filtering.
   * ---------------------------------------------------------
   */

  const filteredRecords =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return flockFilteredRecords;
      }

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return flockFilteredRecords.filter(
        (record) => {
          const feedType =
            String(
              record.feed_type ||
                ""
            ).toLowerCase();

          const supplier =
            String(
              record.supplier ||
                ""
            ).toLowerCase();

          const date =
            String(
              record.purchase_date ||
                ""
            ).toLowerCase();

          return (
            feedType.includes(
              query
            ) ||
            supplier.includes(
              query
            ) ||
            date.includes(
              query
            )
          );
        }
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
      totalItems /
        pageSize
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    pageSize;

  const paginatedRecords =
    filteredRecords.slice(
      startIndex,
      startIndex +
        pageSize
    );

  /*
   * ---------------------------------------------------------
   * RESET PAGINATION
   *
   * Reset whenever search, flock or date range changes.
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
   * EDIT GOVERNANCE
   * ---------------------------------------------------------
   */

  function handleEditRecord(
    record: any
  ) {
    const governanceResult =
      canEdit(
        {
          id:
            user?.id ||
            "",
          role:
            profile?.role ||
            "",
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

    setEditingRecord(
      record
    );

    setIsEditModalOpen(
      true
    );
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(
      false
    );

    setEditingRecord(
      null
    );
  }

  /*
   * ---------------------------------------------------------
   * KPI CARDS
   *
   * Purchased = selected period
   * Consumed = selected period
   * Current Stock = actual farm/flock balance
   * ---------------------------------------------------------
   */

  const kpiCards = (
    <>
      {/* Purchased */}

      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">

          <div className="min-w-0">

            <div className="text-sm font-medium text-slate-500">
              Purchased
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(
                kpiValues.purchased.toFixed(
                  2
                )
              )}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              kg · Selected period
            </div>

          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />

        </div>

      </div>

      {/* Consumed */}

      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">

          <div className="min-w-0">

            <div className="text-sm font-medium text-slate-500">
              Consumed
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(
                kpiValues.consumed.toFixed(
                  2
                )
              )}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              kg · Selected period
            </div>

          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />

        </div>

      </div>

      {/* Current Stock */}

      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">

        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">

          <div className="min-w-0">

            <div className="text-sm font-medium text-slate-500">
              Current Stock
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(
                kpiValues.currentStock.toFixed(
                  2
                )
              )}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              kg · Current farm balance
            </div>

          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />

        </div>

      </div>
    </>
  );

  /*
   * ---------------------------------------------------------
   * SEARCH TOOLBAR
   * ---------------------------------------------------------
   */

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search inventory records..."
      searchValue={
        searchQuery
      }
      onSearchChange={
        setSearchQuery
      }
    />
  );

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  const pagination = (
    <OperationsPagination
      current={
        currentPage
      }
      total={
        totalPages
      }
      pageSize={
        pageSize
      }
      totalItems={
        totalItems
      }
      onPageChange={
        setCurrentPage
      }
    />
  );

  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */

  if (farmLoading) {
    return (
      <AppShell
        email={
          user?.email ||
          ""
        }
      >
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
      email={
        user?.email ||
        ""
      }
    >
      <div className="space-y-6">

        {/* Page Title */}

        <h1 className="text-2xl font-bold text-slate-900">
          Feed Inventory
        </h1>

        {/* KPI Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiCards}
        </div>

        {/* Search + Flock + Date Filter */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          <div className="flex-1">
            {toolbar}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Flock Filter */}

            <select
              value={
                selectedFlockId
              }
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
                    key={
                      flock.id
                    }
                    value={
                      flock.id
                    }
                  >
                    {
                      flock.flock_name
                    }
                  </option>
                )
              )}
            </select>

            {/* Date Filter */}

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

        {/* Selected Flock Indicator */}

        {selectedFlockId && (
          <div className="flex items-center gap-2">

            <span className="text-sm text-slate-500">
              Showing feed inventory for:
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
                setSelectedFlockId(
                  ""
                )
              }
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>

          </div>
        )}

        {/* Feed Stock Summary */}

        <FeedStockSummary
          records={
            flockFilteredAllRecords
          }
          feedRecords={
            flockFilteredAllFeedRecords
          }
        />

        {/* Main Content */}

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Purchase Records */}

          <div className="lg:col-span-8 lg:order-first">

            {inventoryLoading ? (
              <div className="space-y-3">

                {[1, 2, 3].map(
                  (i) => (
                    <div
                      key={i}
                      className="h-40 bg-slate-200 rounded-2xl animate-pulse"
                    />
                  )
                )}

              </div>
            ) : (
              <FeedStockList
                records={
                  paginatedRecords
                }
                onEdit={
                  handleEditRecord
                }
              />
            )}

          </div>

          {/* Quick Entry */}

          <div className="lg:col-span-4 lg:order-last">

            <div className="lg:sticky lg:top-20">

              <AddFeedStockForm
                farmId={
                  farmId
                }
                user={
                  user
                }
                onSaved={
                  refresh
                }
              />

            </div>

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

                <EditFeedStockForm
                  record={
                    editingRecord
                  }
                  onClose={
                    handleCloseEditModal
                  }
                  onSaved={
                    refresh
                  }
                  user={
                    user
                  }
                  profile={
                    profile
                  }
                />

              </div>

            </div>
          )}

      </div>
    </AppShell>
  );
}