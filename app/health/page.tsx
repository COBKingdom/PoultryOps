"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useHealth } from "@/hooks/useHealth";
import { useFlocks } from "@/hooks/useFlocks";

import { useEffect, useMemo, useState } from "react";

import {
  DateRangeSelection,
  getDefaultDateRangeSelection,
} from "@/lib/date-ranges";

import { canEdit } from "@/lib/permissions/governance";

import { Activity } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import OperationsToolbar from "@/components/operations/operations-toolbar";
import OperationsPagination from "@/components/operations/operations-pagination";

import ReportFilter from "@/components/reports/report-filter";

import AddHealthForm from "@/components/health/add-health-form";
import HealthList from "@/components/health/health-list";
import EditHealthForm from "@/components/health/edit-health-form";

export default function HealthPage() {
  const { user, profile } = useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    flocks,
  } = useFlocks(farmId);

  const {
    records,
    refresh,
  } = useHealth(farmId);

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

  const dateRange =
    dateRangeSelection.range;

  const dateFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate =
        record.health_date;

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
   * KPI VALUES
   * ---------------------------------------------------------
   */

  const kpiValues = useMemo(() => {
    const totalRecords =
      dateFilteredRecords.length;

    const activeCases =
      dateFilteredRecords.filter(
        (record) =>
          record.status === "active" ||
          record.status === "treatment"
      ).length;

    const totalCost =
      dateFilteredRecords.reduce(
        (sum, record) =>
          sum +
          Number(record.cost || 0),
        0
      );

    return {
      totalRecords,
      activeCases,
      totalCost,
    };
  }, [
    dateFilteredRecords,
  ]);

  /*
   * ---------------------------------------------------------
   * SEARCH FILTER
   * ---------------------------------------------------------
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
        record.diagnosis
          ?.toLowerCase()
          .includes(query) ||
        record.treatment
          ?.toLowerCase()
          .includes(query)
    );
  }, [
    dateFilteredRecords,
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
        label="Total Records"
        value={kpiValues.totalRecords}
        icon={<Activity size={20} />}
        valueColor="blue"
        iconBg="blue"
      />

      <OperationsKpiCard
        label="Active Cases"
        value={kpiValues.activeCases}
        icon={<Activity size={20} />}
        valueColor="amber"
        iconBg="amber"
      />

      <OperationsKpiCard
        label="Total Cost"
        value={kpiValues.totalCost}
        currency={data?.farm?.currency}
        icon={<Activity size={20} />}
        valueColor="red"
        iconBg="red"
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
      searchPlaceholder="Search health records..."
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
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* Page Title */}

        <h1 className="text-2xl font-bold text-slate-900">
          Health & Treatments
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

              <AddHealthForm
                farmId={farmId}
                flocks={flocks}
                onSaved={refresh}
              />

            </div>
          </div>

          {/* Records List */}

          <div className="lg:col-span-8 lg:order-first">

            <HealthList
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

                <EditHealthForm
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