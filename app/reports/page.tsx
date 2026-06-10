"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useReports } from "@/hooks/useReports";

import ProductionSummary from "@/components/reports/production-summary";
import FinancialSummary from "@/components/reports/financial-summary";
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

      <h1 className="text-3xl font-bold">
        Reports
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        <ProductionSummary
          report={report}
        />

        <FinancialSummary
          report={report}
        />
        <ExportButtons
         report={report}
        />

      </div>

    </div>
  );
}