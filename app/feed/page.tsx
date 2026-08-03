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

import { TrendingUp } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import AddFeedForm from "@/components/feed/add-feed-form";
import FeedList from "@/components/feed/feed-list";
import FeedSummary from "@/components/feed/feed-summary";

export default function FeedPage() {
  const { user } =
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


  // ── Filter records by search query ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();

    return records.filter(
      (record) =>
        record.flocks?.flock_name?.toLowerCase().includes(query) ||
        record.feed_type?.toLowerCase().includes(query) ||
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


  const toolbar = (
    <OperationsToolbar
      searchPlaceholder="Search feed records..."
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
        <h1 className="text-2xl font-bold text-slate-900">Feed Management</h1>

        {/* ── KPI cards section ─────────────────────────────────────────── */}
        <FeedSummary records={records} />

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
              <AddFeedForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />
            </div>
          </div>

          {/* Records list — second on mobile, left column on desktop */}
          <div className="lg:col-span-8 lg:order-first">
            <FeedList
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