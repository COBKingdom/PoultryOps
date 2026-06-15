"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useReports } from "@/hooks/useReports";

import ReportKpis from "@/components/reports/report-kpis";
import ProductionSummary from "@/components/reports/production-summary";
import OperationsSummary from "@/components/reports/operations-summary";
import FarmHealthSummary from "@/components/reports/farm-health-summary";
import ExportButtons from "@/components/reports/export-buttons";

export default function ReportsPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    report,
    loading: reportsLoading,
  } = useReports(
    farmId
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
    <div className="p-6 space-y-6">

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
  );
}