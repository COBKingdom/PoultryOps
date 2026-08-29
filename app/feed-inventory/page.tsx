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

import OperationsKpiCard from "@/components/operations/operations-kpi-card";
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
   * Load farm flocks.
   *
   * Kept here so the page remains compatible
   * with the rest of the PoultryOps architecture
   * and future feed intelligence features.
   */
  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) return;

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
      }
    }

    loadFlocks();
  }, [farmId]);

  /*
   * PURCHASES DURING SELECTED PERIOD
   *
   * This controls:
   * - Purchased KPI
   * - Purchase records shown in the list
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
   * FEED CONSUMPTION DURING SELECTED PERIOD
   *
   * Consumption comes from the Feed page.
   *
   * This is deliberately kept separate from
   * Current Stock.
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
   * KPI VALUES
   *
   * Purchased:
   *   Feed purchased during the selected period.
   *
   * Consumed:
   *   Feed consumed during the selected period.
   *
   * Current Stock:
   *   Actual cumulative farm stock.
   *
   * IMPORTANT:
   *
   * Current Stock intentionally ignores the selected
   * date filter. It represents the farm's actual
   * operational feed position:
   *
   *   All purchases
   *   - All recorded consumption
   *   = Current Stock
   *
   * Therefore Current Stock can legitimately be higher
   * than the amount purchased during the currently
   * selected period.
   */
  const kpiValues =
    useMemo(() => {
      const purchased =
        dateFilteredRecords.reduce(
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
        dateFilteredFeed.reduce(
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
        records.reduce(
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
        feedRecords.reduce(
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
       * Actual current farm stock.
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
      records,
      feedRecords,
      dateFilteredRecords,
      dateFilteredFeed,
    ]);

  /*
   * Search purchase records.
   */
  const filteredRecords =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return dateFilteredRecords;
      }

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return dateFilteredRecords.filter(
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
   * KPI CARDS
   *
   * The labels deliberately distinguish:
   *
   * Purchased = selected period
   * Consumed = selected period
   * Current Stock = actual farm balance
   */
  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Purchased"
        value={
          Number(
            kpiValues.purchased.toFixed(
              2
            )
          )
        }
        sublabel="kg • Selected period"
        icon={
          <Package
            size={20}
          />
        }
        valueColor="blue"
        iconBg="blue"
      />

      <OperationsKpiCard
        label="Consumed"
        value={
          Number(
            kpiValues.consumed.toFixed(
              2
            )
          )
        }
        sublabel="kg • Selected period"
        icon={
          <TrendingDown
            size={20}
          />
        }
        valueColor="green"
        iconBg="green"
      />

      <OperationsKpiCard
        label="Current Stock"
        value={
          Number(
            kpiValues.currentStock.toFixed(
              2
            )
          )
        }
        sublabel="kg • Current farm balance"
        icon={
          <Boxes
            size={20}
          />
        }
        valueColor="blue"
        iconBg="blue"
      />
    </>
  );

  /*
   * Search toolbar.
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
   * Pagination.
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
   * Loading state.
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

        {/* Search + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          <div className="flex-1">
            {toolbar}
          </div>

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

        {/* Feed Stock Summary */}
        <FeedStockSummary
          records={
            records
          }
          feedRecords={
            feedRecords
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