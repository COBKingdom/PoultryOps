"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import {
  getDefaultDateRangeSelection,
  DateRangeSelection,
} from "@/lib/date-ranges";

import AppShell from "@/components/layout/app-shell";

import KpiCard from "@/components/dashboard/kpi-card";
import QuickActions from "@/components/dashboard/quick-actions";
import FarmHero from "@/components/dashboard/farm-hero";
import FarmHealth from "@/components/dashboard/farm-health";
import RecentActivity from "@/components/dashboard/recent-activity";
import OwnerOnly from "@/components/auth/owner-only";

import ReportFilter from "@/components/reports/report-filter";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  /*
   * Dashboard date filter.
   *
   * Defaults to Today.
   *
   * The financial figures respond to the
   * selected date range.
   *
   * Operational figures such as available
   * birds, birds in isolation, available eggs
   * and flock count remain current farm figures.
   */
  const [
    dateRangeSelection,
    setDateRangeSelection,
  ] = useState<DateRangeSelection>(
    getDefaultDateRangeSelection()
  );

  const {
    currentBirds,
    isolatedBirds,
    availableEggs,
    totalFlocks,
    totalRevenue,
    totalExpenses,
    profit,
    productionPercentage,
  } = useDashboardStats(
    farm?.id,
    dateRangeSelection.range
  );

  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">

            <div
              className="
                inline-block
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-solid
                border-blue-600
                border-r-transparent
              "
            />

            <p className="mt-4 text-slate-600">
              Loading dashboard...
            </p>

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

        <div className="space-y-4">

          {/* ─────────────────────────────────────────────
              FARM HERO
          ───────────────────────────────────────────── */}

          <FarmHero
            currentBirds={
              currentBirds
            }
            isolatedBirds={
              isolatedBirds
            }
            availableEggs={
              availableEggs
            }
            totalFlocks={
              totalFlocks
            }
          />

          {/* ─────────────────────────────────────────────
              DATE FILTER
              
              Subscription / trial information does not
              belong on the operational dashboard.
              That information remains in Billing /
              Subscription.
          ───────────────────────────────────────────── */}

          <div
            className="
              flex
              justify-start
              sm:justify-end
              w-full
            "
          >

            <ReportFilter
              value={
                dateRangeSelection
              }
              onChange={
                setDateRangeSelection
              }
            />

          </div>

          {/* ─────────────────────────────────────────────
              FINANCIAL KPIs
          ───────────────────────────────────────────── */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-4
            "
          >

            <KpiCard
              title="Revenue"
              value={
                totalRevenue
              }
              currency={
                farm?.currency
              }
            />

            <KpiCard
              title="Expenses"
              value={
                totalExpenses
              }
              currency={
                farm?.currency
              }
            />

            <KpiCard
              title="Profit / Loss"
              value={profit}
              currency={
                farm?.currency
              }
            />

          </div>

          {/* ─────────────────────────────────────────────
              QUICK ACTIONS
          ───────────────────────────────────────────── */}

          <QuickActions />

          {/* ─────────────────────────────────────────────
              FARM HEALTH
          ───────────────────────────────────────────── */}

          <FarmHealth
            currentBirds={
              currentBirds
            }
            productionPercentage={
              productionPercentage
            }
          />

          {/* ─────────────────────────────────────────────
              RECENT ACTIVITY
          ───────────────────────────────────────────── */}

          <RecentActivity />

        </div>

      </AppShell>

    </OwnerOnly>
  );
}