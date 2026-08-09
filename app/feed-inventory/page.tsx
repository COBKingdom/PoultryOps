"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import { useFeed } from "@/hooks/useFeed";

import { useEffect, useMemo, useState } from "react";

import { canEdit } from "@/lib/permissions/governance";

import { Package } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddFeedStockForm from "@/components/feed-inventory/add-feed-stock-form";
import FeedStockList from "@/components/feed-inventory/feed-stock-list";
import FeedStockSummary from "@/components/feed-inventory/feed-stock-summary";
import EditFeedStockForm from "@/components/feed-inventory/edit-feed-stock-form";

export default function FeedInventoryPage() {
  const { user, profile } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    records:
      inventoryRecords,
    refresh,
  } = useFeedInventory(
    farmId
  );

  const {
    records:
      feedRecords,
  } = useFeed(
    farmId
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


  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return inventoryRecords;

    const query = searchQuery.toLowerCase();

    return inventoryRecords.filter(
      (record) =>
        record.flocks?.flock_name?.toLowerCase().includes(query) ||
        record.feed_type?.toLowerCase().includes(query) ||
        String(record.quantity).includes(query)
    );
  }, [inventoryRecords, searchQuery]);

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

  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search inventory records..."
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
        <h1 className="text-2xl font-bold text-slate-900">Feed Inventory</h1>

        {/* ── KPI cards section ─────────────────────────────────────────── */}
        <FeedStockSummary 
          inventoryRecords={inventoryRecords}
          feedRecords={feedRecords}
        />

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
              <AddFeedStockForm
                farmId={farmId}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <FeedStockList
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
              <EditFeedStockForm
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
