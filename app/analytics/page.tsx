"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import RevenueChart from "@/components/analytics/revenue-chart";
import ProductionChart from "@/components/analytics/production-chart";

export default function AnalyticsPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const stats =
    useDashboardStats(
      farmId
    );

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Analytics
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        <RevenueChart
          revenue={
            stats.totalRevenue
          }
          expenses={
            stats.totalExpenses
          }
        />

        <ProductionChart
          eggs={
            stats.todayEggs
          }
          birds={
            stats.currentBirds
          }
        />

      </div>

    </div>
  );
}