"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useExpenses } from "@/hooks/useExpenses";

import { useEffect, useMemo, useState } from "react";

import { ReceiptText, Wallet, ClipboardList } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";

export default function ExpensesPage() {
  const { user } =
    useAuth();

  const { farm, loading: farmLoading } = useCurrentFarm();

  const {
    records,
    refresh,
  } = useExpenses(
    farm?.id
  );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);
  const pageSize = 10;

  // ── Compute KPI values ────────────────────────────────────────────────────
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const kpiValues = useMemo(() => {
    const todayExpenses =
      records
        .filter(
          (record) =>
            record.expense_date ===
            today
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(record.amount),
          0
        );

    const totalExpenses =
      records.reduce(
        (sum, record) =>
          sum +
          Number(record.amount),
        0
      );

    const transactionCount =
      records.length;

    return { todayExpenses, totalExpenses, transactionCount };
  }, [records, today]);

  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.description?.toLowerCase().includes(query) ||
        record.category?.toLowerCase().includes(query) ||
        String(record.amount).includes(query)
    );
  }, [records, searchQuery]);

  // ── Paginate filtered records ─────────────────────────────────────────────
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + pageSize
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Today"
        value={kpiValues.todayExpenses}
        sublabel="expenses"
        icon={<ReceiptText size={20} />}
        valueColor="red"
        iconBg="red"
      />
      <OperationsKpiCard
        label="Total Expenses"
        value={kpiValues.totalExpenses}
        icon={<Wallet size={20} />}
        valueColor="red"
        iconBg="red"
      />
      <OperationsKpiCard
        label="Transactions"
        value={kpiValues.transactionCount}
        icon={<ClipboardList size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
    </>
  );

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search expense records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );

  const pagination = (
    <OperationsPagination
      current={currentPage}
      total={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
    />
  );

  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
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

        {/* ── Page Title ─────────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-slate-900">Expenses Management</h1>

        {/* ── KPI cards section ─────────────────────────────────────────── */}
        {kpiCards && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards}
          </div>
        )}

        {/* ── Filter / Search toolbar ───────────────────────────────────── */}
        {toolbar && (
          <div className="flex items-center justify-between">
            {toolbar}
          </div>
        )}

        {/* ── Main content: Quick Entry + Records list ─────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Quick Entry — first on mobile, right column on desktop */}
          <div className="lg:col-span-4 lg:order-last">
            <div className="lg:sticky lg:top-20 space-y-4">
              <AddExpenseForm
                farmId={farm?.id}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <ExpenseList
              records={paginatedRecords}
            />
          </div>
        </div>

        {/* ── Pagination area ───────────────────────────────────────────── */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

      </div>
    </AppShell>
  );
}