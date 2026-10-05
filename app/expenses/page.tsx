"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useExpenses } from "@/hooks/useExpenses";

import { useEffect, useMemo, useState } from "react";

import {
  DateRangeSelection,
  getDefaultDateRangeSelection,
} from "@/lib/date-ranges";

import { getFarmFlocks } from "@/lib/flocks";

import { canEdit } from "@/lib/permissions/governance";

import AppShell from "@/components/layout/app-shell";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";
import EditExpenseForm from "@/components/expenses/edit-expense-form";

export default function ExpensesPage() {
  const { user, profile } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const {
    records,
    refresh,
  } = useExpenses(farm?.id);

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedFlockId, setSelectedFlockId] =
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
   * LOAD FARM FLOCKS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadFlocks() {
      if (!farm?.id) {
        setFlocks([]);
        return;
      }

      try {
        const result =
          await getFarmFlocks(farm.id);

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
  }, [farm?.id]);

  /*
   * ---------------------------------------------------------
   * DATE FILTER
   * ---------------------------------------------------------
   */

  const dateRange =
    dateRangeSelection.range;

  const dateFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate =
        record.expense_date;

      if (!recordDate) return false;

      return (
        recordDate >= dateRange.start &&
        recordDate <= dateRange.end
      );
    });
  }, [
    records,
    dateRange,
  ]);

  /*
   * ---------------------------------------------------------
   * FLOCK FILTER
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * KPI VALUES
   * ---------------------------------------------------------
   */

  const kpiValues = useMemo(() => {
    const totalExpenses =
      flockFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.amount || 0),
        0
      );

    const transactionCount =
      flockFilteredRecords.length;

    return {
      totalExpenses,
      transactionCount,
    };
  }, [
    flockFilteredRecords,
  ]);

  /*
   * ---------------------------------------------------------
   * SEARCH FILTER
   * ---------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return flockFilteredRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return flockFilteredRecords.filter(
      (record) =>
        record.description
          ?.toLowerCase()
          .includes(query) ||
        record.category
          ?.toLowerCase()
          .includes(query) ||
        String(record.amount)
          .includes(query)
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
      {/* Total Expenses */}

      <div
        className="
          relative overflow-hidden rounded-xl
          border border-blue-100
          bg-white
          p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Total Expenses
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: farm?.currency || "NGN",
                maximumFractionDigits: 2,
              }).format(kpiValues.totalExpenses)}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Expenses in selected period
            </div>
          </div>

          <div
            className="
              mt-0.5 h-3.5 w-3.5 shrink-0
              rounded-full
              bg-red-500
              ring-4 ring-red-100
            "
          />
        </div>
      </div>

      {/* Transactions */}

      <div
        className="
          relative overflow-hidden rounded-xl
          border border-blue-100
          bg-white
          p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Transactions
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {kpiValues.transactionCount.toLocaleString()}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Expense transactions
            </div>
          </div>

          <div
            className="
              mt-0.5 h-3.5 w-3.5 shrink-0
              rounded-full
              bg-blue-600
              ring-4 ring-blue-100
            "
          />
        </div>
      </div>
    </>
  );

  /*
   * ---------------------------------------------------------
   * TOOLBAR
   * ---------------------------------------------------------
   */

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search expense records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <select
        value={selectedFlockId}
        onChange={(e) =>
          setSelectedFlockId(
            e.target.value
          )
        }
        className="
          w-full sm:w-52
          border border-slate-200
          bg-white
          rounded-xl
          px-4 py-3
          text-sm text-slate-700
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
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

  if (farmLoading) {
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
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* Page Title */}

        <h1 className="text-2xl font-bold text-slate-900">
          Expenses Management
        </h1>

        {/* KPI Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards}
        </div>

        {/* Filter / Search Toolbar */}

        <div className="flex items-center justify-between">
          {toolbar}
        </div>

        {/* Main content */}

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* Quick Entry */}

          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">

              <AddExpenseForm
                farmId={farm?.id}
                onSaved={refresh}
              />

            </div>
          </div>

          {/* Records List */}

          <div className="lg:col-span-8 lg:order-first">

            <ExpenseList
              records={paginatedRecords}
              onEdit={handleEditRecord}
              currency={farm?.currency}
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

                <EditExpenseForm
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