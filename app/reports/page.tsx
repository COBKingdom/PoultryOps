"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useReports } from "@/hooks/useReports";

import AppShell from "@/components/layout/app-shell";

import ReportKpis from "@/components/reports/report-kpis";
import ProductionSummary from "@/components/reports/production-summary";
import OperationsSummary from "@/components/reports/operations-summary";
import FarmHealthSummary from "@/components/reports/farm-health-summary";
import ExportButtons from "@/components/reports/export-buttons";
import OwnerOnly from "@/components/auth/owner-only";

export default function ReportsPage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const {
    report,
    loading: reportsLoading,
  } = useReports(
    farm?.id
  );

  if (
    loading ||
    reportsLoading ||
    !report
  ) {
    return (
      <div className="p-6">
        Loading Reports...
      </div>
    );
  }

  return (
  <OwnerOnly>
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold">
            Reports Center
          </h1>

          <p className="text-slate-500 mt-1">
            Farm Performance & Business Intelligence
          </p>

        </div>

        <ReportKpis
          report={report}
        />

        <div className="grid lg:grid-cols-2 gap-6">

          <ProductionSummary
            report={report}
          />

          <OperationsSummary
            report={report}
          />

        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          <FarmHealthSummary
            report={report}
          />

          <ExportButtons
            report={report}
          />

        </div>

      </div>
    </AppShell>
  </OwnerOnly>
);
}