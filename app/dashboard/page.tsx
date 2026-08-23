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

/*
 * Demo-only showcase for DEMO-001.
 * Normal farms keep the original dashboard below.
 */
import DemoDashboard from "@/components/dashboard/demo-dashboard";

/**
 * Demo-only initial date range for DEMO-001
 * ("PoultryOps Demo Farm").
 *
 * Returns a local "last 30 days" selection (today back 30 days)
 * using only the existing custom-range infrastructure. No shared
 * global date-range preset is added.
 */
function getDemoInitialDateRangeSelection(): DateRangeSelection {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    preset: "custom",
    range: {
      start: toDateString(start),
      end: toDateString(now),
    },
  };
}

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  /*
   * DEMO-001 is identified before state init so its
   * default date range can be set without affecting
   * any other farm.
   */
  const isDemo =
    farm?.farm_code === "DEMO-001" ||
    farm?.name === "PoultryOps Demo Farm";

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

  /*
   * Tracks whether the user has manually adjusted the
   * date filter. Used to stop applying the demo default
   * once the user interacts with the filter.
   */
  const [userEditedFilter, setUserEditedFilter] =
    useState(false);

  /*
   * For DEMO-001 only, default to the trailing 30 days so
   * the seeded operational history is showcased on load.
   * The demo default applies only until the user interacts
   * with the filter, so a manual change is never overridden.
   * Normal farms are completely unaffected.
   */
  const effectiveDateRange =
    isDemo && !userEditedFilter
      ? getDemoInitialDateRangeSelection()
      : dateRangeSelection;

  function handleDateRangeChange(
    selection: DateRangeSelection
  ) {
    setUserEditedFilter(true);
    setDateRangeSelection(selection);
  }

  const {
    currentBirds,
    isolatedBirds,
    availableEggs,
    totalFlocks,
    todayEggs,
    totalMortality,
    totalExpenses,
    totalRevenue,
    profit,
    productionPercentage,
  } = useDashboardStats(
    farm?.id,
    effectiveDateRange.range
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

  /*
   * DEMO-001 ("PoultryOps Demo Farm") receives a
   * premium, sales-ready showcase.
   *
   * Every other farm renders the original
   * dashboard below — completely unchanged.
   */
  if (isDemo) {
    return (
      <OwnerOnly>

        <AppShell
          email={user?.email}
        >

          <DemoDashboard
            farm={farm}
            stats={{
              currentBirds,
              isolatedBirds,
              availableEggs,
              totalFlocks,
              todayEggs,
              totalMortality,
              totalExpenses,
              totalRevenue,
              profit,
              productionPercentage,
            }}
            dateRangeSelection={effectiveDateRange}
            setDateRangeSelection={handleDateRangeChange}
          />

        </AppShell>

      </OwnerOnly>
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
                effectiveDateRange
              }
              onChange={
                handleDateRangeChange
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