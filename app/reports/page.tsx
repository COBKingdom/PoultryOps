"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useReports } from "@/hooks/useReports";

import AppShell from "@/components/layout/app-shell";

import ReportKpis from "@/components/reports/report-kpis";
import ProductionSummary from "@/components/reports/production-summary";
import OperationsSummary from "@/components/reports/operations-summary";
import FarmHealthSummary from "@/components/reports/farm-health-summary";
import ExportButtons from "@/components/reports/export-buttons";
import ReportToolbar from "@/components/reports/report-toolbar";
import OwnerOnly from "@/components/auth/owner-only";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

export default function ReportsPage() {
  const { user } = useAuth();

  const { data, loading } = useDashboard();

  const farm = data?.farm;

  // ── Global date filter state ──────────────────────────────────────────────
  const [dateRangeSelection, setDateRangeSelection] =
    useState<DateRangeSelection>(getDefaultDateRangeSelection());

  // ── Reports data (recalculates when the date range changes) ───────────────
  const { report, loading: reportsLoading } = useReports(
    farm?.id,
    dateRangeSelection
  );

  if (loading || reportsLoading || !report) {
    return (
      <OwnerOnly>
        <AppShell email={user?.email}>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div>
              <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-5 w-72 bg-slate-200 rounded animate-pulse mt-2" />
            </div>

            {/* Toolbar skeleton */}
            <div className="h-14 bg-slate-200 rounded-2xl animate-pulse" />

            {/* KPI skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-3" />
                  <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </AppShell>
      </OwnerOnly>
    );
  }

  return (
    <OwnerOnly>
      <AppShell email={user?.email}>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold">Reports Center</h1>
            <p className="text-slate-500 mt-1">
              Farm Performance & Business Intelligence
            </p>
          </div>

          {/* Reporting toolbar — period label (left) + filter (right) */}
          <ReportToolbar
            value={dateRangeSelection}
            onChange={setDateRangeSelection}
          />

          {/* KPIs — recalculate based on selected period */}
          <ReportKpis report={report} currency={farm?.currency} />

          {/* Production & Operations */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ProductionSummary report={report} />
            <OperationsSummary report={report} />
          </div>

          {/* Farm Health & Export */}
          <div className="grid lg:grid-cols-2 gap-6">
            <FarmHealthSummary report={report} />
            <ExportButtons report={report} currency={farm?.currency} />
          </div>
        </div>
      </AppShell>
    </OwnerOnly>
  );
}