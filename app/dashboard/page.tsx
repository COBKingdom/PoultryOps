"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import AppShell from "@/components/layout/app-shell";

import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";
import FarmHero from "@/components/dashboard/farm-hero";
import FarmHealth from "@/components/dashboard/farm-health";
import RecentActivity from "@/components/dashboard/recent-activity";

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
          currentBirds={currentBirds}
          productionPercentage={
            productionPercentage
          }
        />

        <div className="flex flex-wrap gap-3">

          <div
            className="
              px-4
              py-2
              rounded-full
              bg-green-100
              text-green-700
              text-sm
              font-medium
            "
          >
            Trial Active
          </div>

          <div
            className="
              px-4
              py-2
              rounded-full
              bg-blue-100
              text-blue-700
              text-sm
              font-medium
            "
          >
            {currentBirds} Birds
          </div>

          <div
            className="
              px-4
              py-2
              rounded-full
              bg-purple-100
              text-purple-700
              text-sm
              font-medium
            "
          >
            Production {productionPercentage}%
          </div>

        </div>

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4
          "
        >
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
        </div>
        <QuickActions />
        <FarmHealth
          currentBirds={currentBirds}
          productionPercentage={
            productionPercentage
          }
        />
        <RecentActivity />
        
      </div>
    </AppShell>
  );
}