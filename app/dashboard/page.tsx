"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import AppShell from "@/components/layout/app-shell";

import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";
import FarmHero from "@/components/dashboard/farm-hero";
import FarmHealth from "@/components/dashboard/farm-health";
import RecentActivity from "@/components/dashboard/recent-activity";
import OwnerOnly from "@/components/auth/owner-only";

export default function DashboardPage() {
  const { user } =
    useAuth();

  const { farm, loading: farmLoading } = useCurrentFarm();

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

  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <OwnerOnly>
      <AppShell
        email={user?.email}
      >
      <div className="space-y-6">

        <FarmHero
          currentBirds={
            currentBirds
          }
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
            {Number(currentBirds).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })} Birds
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
            Production {Number(productionPercentage).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}%
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
            currency={farm?.currency}
          />

          <KpiCard
            title="Expenses"
            value={totalExpenses}
            currency={farm?.currency}
          />

          <KpiCard
            title="Profit"
            value={profit}
            currency={farm?.currency}
          />
        </div>

        <QuickActions />

        <FarmHealth
          currentBirds={
            currentBirds
          }
          productionPercentage={
            productionPercentage
          }
        />

        <RecentActivity />

      </div>
    </AppShell>
  </OwnerOnly>
);
}