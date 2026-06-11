"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import AppShell from "@/components/layout/app-shell";

import SubscriptionCard from "@/components/dashboard/subscription-card";
import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    loading,
    data,
  } = useDashboard();

  const farm = data?.farm;

  const subscription =
    data?.subscription;

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

  let daysRemaining = 0;

  if (subscription?.trial_end) {
    const end =
      new Date(
        subscription.trial_end
      );

    const today =
      new Date();

    daysRemaining =
      Math.max(
        0,
        Math.ceil(
          (
            end.getTime() -
            today.getTime()
          ) /
            (
              1000 *
              60 *
              60 *
              24
            )
        )
      );
  }

  return (
    <AppShell
      email={user?.email}
    >
      <div className="space-y-6">

        {/* Farm Name Banner */}

        <div
          className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            p-5
            shadow-sm
          "
        >
          <p
            className="
              text-sm
              text-slate-500
            "
          >
            Active Farm
          </p>

          <h2
            className="
              text-2xl
              font-bold
              text-slate-900
              mt-1
            "
          >
            {farm?.name}
          </h2>
        </div>

        {/* KPI Cards */}

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

        {/* Subscription */}

        <SubscriptionCard
          plan={
            subscription?.plan
          }
          status={
            subscription?.status
          }
          daysRemaining={
            daysRemaining
          }
        />

        {/* Quick Actions */}

        <QuickActions />

      </div>
    </AppShell>
  );
}