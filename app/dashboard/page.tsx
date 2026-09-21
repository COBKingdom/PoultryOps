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
import OwnerOnly from "@/components/auth/owner-only";

import ReportFilter from "@/components/reports/report-filter";

import FarmHero from "@/components/dashboard/farm-hero";
import AttentionNeeded from "@/components/dashboard/attention-needed";
import FarmHealth from "@/components/dashboard/farm-health";
import FinancialOverview from "@/components/dashboard/financial-overview";
import ProductionPerformance from "@/components/dashboard/production-performance";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";


/*
 * Demo-only showcase for DEMO-001.
 * Normal farms use the production dashboard below.
 */
import DemoDashboard from "@/components/dashboard/demo-dashboard";

/**
 * Demo-only initial date range for DEMO-001.
 *
 * Uses the existing custom-range infrastructure and
 * does not introduce a new global date preset.
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
   * DEMO-001 is kept completely separate from
   * the normal subscriber dashboard.
   */
  const isDemo =
    farm?.farm_code === "DEMO-001" ||
    farm?.name === "PoultryOps Demo Farm";

  /*
   * Existing dashboard date filter.
   *
   * Defaults to Today.
   *
   * No change to the existing date-range infrastructure.
   */
  const [
    dateRangeSelection,
    setDateRangeSelection,
  ] = useState<DateRangeSelection>(
    getDefaultDateRangeSelection()
  );

  /*
   * Used only for the existing DEMO-001 behaviour.
   */
  const [
    userEditedFilter,
    setUserEditedFilter,
  ] = useState(false);

  /*
   * DEMO-001 defaults to the trailing 30 days
   * until the user manually changes the filter.
   *
   * Normal farms are unaffected.
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

  /*
   * Existing dashboard statistics.
   *
   * No calculations have been changed.
   */
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

  /*
   * Existing loading state.
   */
  if (farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex h-96 items-center justify-center">
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
   * DEMO-001 remains completely separate.
   *
   * Nothing in the new Command Centre layout
   * affects the demo dashboard.
   */
  if (isDemo) {
    return (
      <OwnerOnly>
        <AppShell email={user?.email}>
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

  /*
   * NORMAL SUBSCRIBER DASHBOARD
   *
   * Layout hierarchy:
   *
   * 1. Date context
   * 2. Farm Performance
   * 3. Attention / Health / Financial
   * 4. Farm Operations
   * 5. Quick Actions
   *
   * All underlying data remains unchanged.
   */
  return (
    <OwnerOnly>
      <AppShell email={user?.email}>
        <div className="space-y-5">

          {/* DATE FILTER */}

          <div
            className="
              flex
              justify-end
            "
          >
            <ReportFilter
              value={effectiveDateRange}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* FARM PERFORMANCE HERO */}

          <FarmHero
            currentBirds={currentBirds}
            isolatedBirds={isolatedBirds}
            availableEggs={availableEggs}
            totalFlocks={totalFlocks}
          />

          {/* COMMAND CENTRE SUMMARY */}

<div
  className="
    grid
    grid-cols-1
    gap-4
    lg:grid-cols-3
    lg:items-stretch
  "
>
            {/* ATTENTION */}

            <AttentionNeeded
              isolatedBirds={isolatedBirds}
              totalMortality={totalMortality}
            />

            {/* FARM HEALTH */}

            <FarmHealth
              currentBirds={currentBirds}
              productionPercentage={productionPercentage}
            />

            {/* FINANCIAL OVERVIEW */}

            <FinancialOverview
              totalRevenue={totalRevenue}
              totalExpenses={totalExpenses}
              profit={profit}
              currency={farm?.currency}
            />
          </div>

{/* FARM OPERATIONS */}

<RecentActivity />

{/* PRODUCTION PERFORMANCE */}

<ProductionPerformance
  todayEggs={todayEggs}
  availableEggs={availableEggs}
  productionPercentage={productionPercentage}
/>

{/* QUICK ACTIONS */}

<QuickActions />

        </div>
      </AppShell>
    </OwnerOnly>
  );
}