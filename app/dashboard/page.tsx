"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import AppShell from "@/components/layout/app-shell";

import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";
import FarmHero from "@/components/dashboard/farm-hero";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    loading,
    data,
  } = useDashboard();

  const farm = data?.farm;

  const {
    currentBirds,
    todayEggs,
    totalRevenue,
    totalExpenses,
    profit,
    productionPercentage,
  } = useDashboardStats(
    farm?.id
  );

  if (loading) {
    return (
      <div className="p-10">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="space-y-6">

        <FarmHero
          farmName={farm?.name}
          currentBirds={currentBirds}
          productionPercentage={
            productionPercentage
          }
        />

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-6
            gap-4
          "
        >
          <KpiCard
            title="Current Birds"
            value={currentBirds}
          />

          <KpiCard
            title="Today's Eggs"
            value={todayEggs}
          />

          <KpiCard
            title="Revenue"
            value={totalRevenue}
          />

          <KpiCard
            title="Expenses"
            value={totalExpenses}
          />

          <KpiCard
            title="Profit"
            value={profit}
          />

          <KpiCard
            title="Production %"
            value={`${productionPercentage}%`}
          />
        </div>

        <QuickActions />

      </div>
    </AppShell>
  );
}