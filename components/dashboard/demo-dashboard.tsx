"use client";

import {
  useMemo,
} from "react";

import { useFeed } from "@/hooks/useFeed";
import {
  DateRangeSelection,
} from "@/lib/date-ranges";

import DemoBanner from "@/components/dashboard/demo-banner";
import DemoHero from "@/components/dashboard/demo-hero";
import DemoKpiGrid from "@/components/dashboard/demo-kpi-grid";
import DemoPerformance from "@/components/dashboard/demo-performance";
import DemoIntelligence from "@/components/dashboard/demo-intelligence";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import ReportFilter from "@/components/reports/report-filter";

type DashboardStats = {
  currentBirds: number;
  isolatedBirds: number;
  availableEggs: number;
  totalFlocks: number;
  todayEggs: number;
  totalMortality: number;
  totalExpenses: number;
  totalRevenue: number;
  profit: number;
  productionPercentage: number;
};

type Props = {
  farm: any | null;
  stats: DashboardStats;
  dateRangeSelection: DateRangeSelection;
  setDateRangeSelection: (
    s: DateRangeSelection
  ) => void;
};

/*
 * Premium Demo Farm dashboard.
 *
 * Only rendered when farm_code === "DEMO-001".
 *
 * Reuses the existing PoultryOps data hooks and
 * presentational components (KpiCard, RevenueChart,
 * ProductionChart, FarmInsights, QuickActions,
 * RecentActivity, ReportFilter). Feed and FCR are
 * derived from the existing useFeed hook + real
 * feed records — nothing is hard-coded.
 */
export default function DemoDashboard({
  farm,
  stats,
  dateRangeSelection,
  setDateRangeSelection,
}: Props) {
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
  } = stats;

      const demoProductionPercentage =
    dateRangeSelection.range.start !==
      dateRangeSelection.range.end &&
    currentBirds > 0
      ? Number(
          (
            (availableEggs /
              currentBirds /
              (
                (new Date(
                  dateRangeSelection.range.end
                ).getTime() -
                  new Date(
                    dateRangeSelection.range.start
                  ).getTime()) /
                  (1000 * 60 * 60 * 24) +
                1
              )) *
            100
          ).toFixed(2)
        )
      : productionPercentage;

  /*
   * Feed consumption for the selected period,
   * computed from the existing useFeed hook.
   * FCR = feed (kg) / eggs in the same period.
   */
  const { records: feedRecords } = useFeed(
    farm?.id
  );

  const periodFeed = useMemo(() => {
    if (!feedRecords) return 0;

    const { start, end } =
      dateRangeSelection.range;

    return feedRecords.reduce(
      (sum: number, record: any) => {
        const d = String(
          record.feed_date ?? ""
        ).slice(0, 10);

        if (d >= start && d <= end) {
          return sum + Number(record.quantity_kg || 0);
        }

        return sum;
      },
      0
    );
  }, [
    feedRecords,
    dateRangeSelection.range.start,
    dateRangeSelection.range.end,
  ]);

  const fcr =
    availableEggs > 0
      ? periodFeed / availableEggs
      : 0;

  return (
    <div className="space-y-6">
      {/* Prominent DEMO MODE banner */}
      <DemoBanner
        farmName={farm?.name}
      />

      {/* Premium hero */}
      <DemoHero
        currentBirds={currentBirds}
        isolatedBirds={isolatedBirds}
        availableEggs={availableEggs}
        totalFlocks={totalFlocks}
        productionPercentage={demoProductionPercentage}
      />

      {/* Date filter (unchanged behaviour) */}
      <div className="flex w-full justify-end">
        <ReportFilter
          value={dateRangeSelection}
          onChange={setDateRangeSelection}
        />
      </div>

      {/* Colourful KPI grid */}
      <DemoKpiGrid
        currentBirds={currentBirds}
        isolatedBirds={isolatedBirds}
        availableEggs={availableEggs}
        totalFlocks={totalFlocks}
        totalMortality={totalMortality}
        totalExpenses={totalExpenses}
        totalRevenue={totalRevenue}
        profit={profit}
        productionPercentage={demoProductionPercentage}
        feedKg={periodFeed}
        fcr={fcr}
        currency={farm?.currency}
      />

      {/* Performance + charts + flocks */}
      <DemoPerformance
        revenue={totalRevenue}
        expenses={totalExpenses}
        currency={farm?.currency}
        eggs={todayEggs}
        birds={currentBirds}
        farmId={farm?.id}
      />

      {/* PoultryOps Intelligence */}
      <DemoIntelligence
        currentBirds={currentBirds}
        totalMortality={totalMortality}
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
        profit={profit}
        productionPercentage={demoProductionPercentage}
        feedKg={periodFeed}
        fcr={fcr}
        currency={farm?.currency}
      />

      {/* Existing operational sections (reused) */}
      <QuickActions />
      <RecentActivity />
    </div>
  );
}