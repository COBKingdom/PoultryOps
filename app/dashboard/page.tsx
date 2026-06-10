"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

import FarmCard from "@/components/dashboard/farm-card";
import SubscriptionCard from "@/components/dashboard/subscription-card";
import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    loading,
    data,
  } = useDashboard();

  const farm =
    data?.farm;

  const subscription =
    data?.subscription;

  const {
    currentBirds,
    todayEggs,
    todayFeed,
    totalMortality,
    totalExpenses,
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
            (1000 *
              60 *
              60 *
              24)
        )
      );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1">
        <Topbar
          email={user?.email}
        />

        <div className="p-6 space-y-6">

          <div className="grid md:grid-cols-2 gap-6">
            <FarmCard
              farmName={farm?.name}
            />

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
          </div>

          <div className="grid md:grid-cols-5 gap-6">

            <KpiCard
              title="Current Birds"
              value={currentBirds}
            />

            <KpiCard
              title="Today's Eggs"
              value={todayEggs}
            />

            <KpiCard
              title="Today's Feed"
              value={`${todayFeed}kg`}
            />

            <KpiCard
              title="Mortality"
              value={totalMortality}
            />

            <KpiCard
              title="Expenses"
              value={totalExpenses}
            />

          </div>

          <QuickActions />

        </div>
      </main>
    </div>
  );
}