"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useSales } from "@/hooks/useSales";

import { useEffect, useMemo, useState } from "react";

import { canEdit } from "@/lib/permissions/governance";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import { getFarmFlocks } from "@/lib/flocks";

import {
  ShoppingCart,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddSaleForm from "@/components/sales/add-sale-form";
import SalesList from "@/components/sales/sales-list";
import EditSaleForm from "@/components/sales/edit-sale-form";

export default function SalesPage() {
  const { user, profile } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm = data?.farm;
  const farmId = farm?.id;

  // ─────────────────────────────────────────────────────────────────────────
  // Load all existing flocks for this farm.
  //
  // This is intentionally dynamic. When a new flock is created, it will
  // automatically become available in the Sales form without any code change.
  // ─────────────────────────────────────────────────────────────────────────
  const [flocks, setFlocks] = useState<any[]>([]);

  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) {
        setFlocks([]);
        return;
      }

      try {
        const result = await getFarmFlocks(farmId);
        setFlocks(result || []);
      } catch (error) {
        console.error("Failed to load farm flocks:", error);
        setFlocks([]);
      }
    }

    loadFlocks();
  }, [farmId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Sales records
  // ─────────────────────────────────────────────────────────────────────────
  const {
    records,
    refresh,
  } = useSales(farmId);

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ─────────────────────────────────────────────────────────────────────────
  // Date range filter
  // ─────────────────────────────────────────────────────────────────────────
  const [dateRangeSelection, setDateRangeSelection] =
    useState<DateRangeSelection>(
      getDefaultDateRangeSelection()
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Edit modal
  // ─────────────────────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState<any | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Filter records by selected date range
  // ─────────────────────────────────────────────────────────────────────────
  const dateFilteredRecords = useMemo(() => {
    const { start, end } =
      dateRangeSelection.range;

    return records.filter((record) => {
      const saleDate = record.sale_date;

      if (!saleDate) {
        return false;
      }

      return (
        saleDate >= start &&
        saleDate <= end
      );
    });
  }, [
    records,
    dateRangeSelection,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // KPI values use the selected date range
  // ─────────────────────────────────────────────────────────────────────────
  const kpiValues = useMemo(() => {
    const totalSales =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.quantity || 0),
        0
      );

    const totalRevenue =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.total_amount || 0),
        0
      );

    const totalRecords =
      dateFilteredRecords.length;

    return {
      totalSales,
      totalRevenue,
      totalRecords,
    };
  }, [dateFilteredRecords]);

  // ─────────────────────────────────────────────────────────────────────────
  // Search within the selected date range
  // ─────────────────────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return dateFilteredRecords;
    }

    const query =
      searchQuery.toLowerCase();

    return dateFilteredRecords.filter(
      (record) =>
        record.buyer_name
          ?.toLowerCase()
          .includes(query) ||
        record.product_type
          ?.toLowerCase()
          .includes(query) ||
        record.item_type
          ?.toLowerCase()
          .includes(query) ||
        record.sale_category
          ?.toLowerCase()
          .includes(query) ||
        String(record.quantity)
          .includes(query)
    );
  }, [
    dateFilteredRecords,
    searchQuery,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────
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

  // Reset pagination whenever search
  // or date range changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    dateRangeSelection,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Edit governance
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // KPI cards
  // ─────────────────────────────────────────────────────────────────────────
  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Total Sales"
        value={kpiValues.totalSales}
        sublabel="units"
        icon={
          <ShoppingCart size={20} />
        }
        valueColor="blue"
        iconBg="blue"
      />

      <OperationsKpiCard
        label="Revenue"
        value={kpiValues.totalRevenue}
        currency={farm?.currency}
        icon={
          <TrendingUp size={20} />
        }
        valueColor="green"
        iconBg="green"
      />

      <OperationsKpiCard
        label="Records"
        value={kpiValues.totalRecords}
        icon={
          <ClipboardList size={20} />
        }
        valueColor="blue"
        iconBg="blue"
      />
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Toolbar
  // ─────────────────────────────────────────────────────────────────────────
  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search sales records..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────
  const pagination = (
    <OperationsPagination
      current={currentPage}
      total={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={setCurrentPage}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          <div />
        </div>
      </AppShell>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Page
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900">
          Sales Management
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards}
        </div>

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

              <AddSaleForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>
          </div>

          {/* Sales Records */}
          <div className="lg:col-span-8 lg:order-first">

            <SalesList
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

                <EditSaleForm
                  record={editingRecord}
                  onClose={handleCloseEditModal}
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