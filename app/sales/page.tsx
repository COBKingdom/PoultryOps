"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useSales } from "@/hooks/useSales";

import { useEffect, useMemo, useState } from "react";

import { canEdit } from "@/lib/permissions/governance";

import { ShoppingCart, TrendingUp, ClipboardList } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddSaleForm from "@/components/sales/add-sale-form";
import SalesList from "@/components/sales/sales-list";
import EditSaleForm from "@/components/sales/edit-sale-form";

export default function SalesPage() {
  const { user, profile } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const {
    records,
    refresh,
  } = useSales(
    farm?.id
  );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);
  const pageSize = 10;

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);
  const [editingRecord, setEditingRecord] =
    useState<any | null>(null);

  // ── Compute KPI values ────────────────────────────────────────────────────
  const kpiValues = useMemo(() => {
    const totalSales = records.reduce(
      (sum, record) => sum + Number(record.quantity),
      0
    );

    const totalRevenue = records.reduce(
      (sum, record) => sum + Number(record.total_amount),
      0
    );

    const totalRecords = records.length;

    return { totalSales, totalRevenue, totalRecords };
  }, [records]);

  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.buyer_name?.toLowerCase().includes(query) ||
        record.product_type?.toLowerCase().includes(query) ||
        String(record.quantity).includes(query)
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

  function handleEditRecord(record: any) {
    // Check Edit Governance
    const governanceResult = canEdit(
      { id: user?.id || "", role: profile?.role || "" },
      record
    );

    if (!governanceResult.allowed) {
      alert(governanceResult.reason || "You cannot edit this record at this time.");
      return;
    }

    setEditingRecord(record);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  }

  const kpiCards = (
    <>
      <OperationsKpiCard
        label="Total Sales"
        value={kpiValues.totalSales}
        sublabel="units"
        icon={<ShoppingCart size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
      <OperationsKpiCard
        label="Revenue"
        value={kpiValues.totalRevenue}
        icon={<TrendingUp size={20} />}
        valueColor="green"
        iconBg="green"
      />
      <OperationsKpiCard
        label="Records"
        value={kpiValues.totalRecords}
        icon={<ClipboardList size={20} />}
        valueColor="blue"
        iconBg="blue"
      />
    </>
  );

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search sales records..."
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

  if (loading) {
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
        <h1 className="text-2xl font-bold text-slate-900">Sales Management</h1>

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
              <AddSaleForm
                farmId={farm?.id}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <SalesList
              records={paginatedRecords}
              onEdit={handleEditRecord}
            />
          </div>
        </div>

        {/* ── Pagination area ───────────────────────────────────────────── */}
        {pagination && (
          <div className="flex items-center justify-center pt-4">
            {pagination}
          </div>
        )}

        {/* ── Edit Modal ───────────────────────────────────────────────── */}
        {isEditModalOpen && editingRecord && (
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
