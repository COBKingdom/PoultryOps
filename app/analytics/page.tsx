"use client";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import AppShell from "@/components/layout/app-shell";

import AnalyticsKpis from "@/components/analytics/analytics-kpis";
import RevenueChart from "@/components/analytics/revenue-chart";
import ProductionChart from "@/components/analytics/production-chart";
import FarmInsights from "@/components/analytics/farm-insights";

export default function AnalyticsPage() {
  const { user } =
    useAuth();

  const {
    data,
    loading,
  } = useDashboard();

  const farm =
    data?.farm;

  const stats =
    useDashboardStats(
      farm?.id
    );

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold">
            Analytics Center
          </h1>

          <p className="text-slate-500 mt-1">
            Track production, profitability and farm health
          </p>

        </div>

        <AnalyticsKpis
          currentBirds={stats.currentBirds}
          productionPercentage={stats.productionPercentage}
          totalMortality={stats.totalMortality}
          totalRevenue={stats.totalRevenue}
          totalExpenses={stats.totalExpenses}
        />

        <div className="grid lg:grid-cols-2 gap-6">

          <RevenueChart
            revenue={stats.totalRevenue}
            expenses={stats.totalExpenses}
          />

          <ProductionChart
            eggs={stats.todayEggs}
            birds={stats.currentBirds}
          />

        </div>

        <FarmInsights
          productionPercentage={stats.productionPercentage}
          totalMortality={stats.totalMortality}
          currentBirds={stats.currentBirds}
          totalRevenue={stats.totalRevenue}
          totalExpenses={stats.totalExpenses}
        />

      </div>
    </AppShell>
  );
}