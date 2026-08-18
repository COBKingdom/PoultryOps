"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAvailableBirds,
  getTotalFlocks,
} from "@/lib/flocks";

import {
  getTotalActiveIsolatedBirds,
} from "@/lib/isolation";

import {
  getEggProduction,
} from "@/lib/eggs";

import {
  getTotalMortality,
} from "@/lib/mortality";

import {
  getExpenses,
} from "@/lib/expenses";

import {
  getSales,
} from "@/lib/sales";

import {
  DateRange,
} from "@/lib/date-ranges";

export function useDashboardStats(
  farmId?: string,
  dateRange?: DateRange
) {
  const [
    currentBirds,
    setCurrentBirds,
  ] = useState(0);

  const [
    isolatedBirds,
    setIsolatedBirds,
  ] = useState(0);

  const [
    availableEggs,
    setAvailableEggs,
  ] = useState(0);

  const [
    totalFlocks,
    setTotalFlocks,
  ] = useState(0);

  const [
    todayEggs,
    setTodayEggs,
  ] = useState(0);

  const [
    totalMortality,
    setTotalMortality,
  ] = useState(0);

  const [
    totalExpenses,
    setTotalExpenses,
  ] = useState(0);

  const [
    totalRevenue,
    setTotalRevenue,
  ] = useState(0);

  const [
    profit,
    setProfit,
  ] = useState(0);

  const [
    productionPercentage,
    setProductionPercentage,
  ] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) return;

        /*
         * Current birds are operational data.
         *
         * getAvailableBirds already accounts for:
         *   Starting Birds
         *   - Mortality
         *   - Birds Sold
         *   - Active Isolation
         *
         * The date filter must NOT change this figure.
         */
        const birdsPromise =
          getAvailableBirds(farmId);

        /*
         * Birds currently in active isolation.
         *
         * These birds remain part of the flock records,
         * but are excluded from Available Birds until
         * they are recovered or otherwise completed.
         */
        const isolatedBirdsPromise =
          getTotalActiveIsolatedBirds(
            farmId
          );

        /*
         * Total number of farm flocks.
         */
        const flocksPromise =
          getTotalFlocks(farmId);

        /*
         * If no date range is supplied,
         * default to today.
         */
        const start =
          dateRange?.start ||
          new Date()
            .toISOString()
            .split("T")[0];

        const end =
          dateRange?.end ||
          start;

        /*
         * Load operational records.
         */
        const [
          birds,
          isolatedBirdsCount,
          flockCount,
          eggs,
          expenses,
          sales,
          mortality,
        ] = await Promise.all([
          birdsPromise,
          isolatedBirdsPromise,
          flocksPromise,
          getEggProduction(farmId),
          getExpenses(farmId),
          getSales(farmId),
          getTotalMortality(farmId),
        ]);

        /*
         * Filter egg production by selected date range.
         */
        const filteredEggs =
          (eggs || []).filter(
            (record: any) => {
              const recordDate =
                record.production_date;

              return (
                recordDate >= start &&
                recordDate <= end
              );
            }
          );

        /*
         * Available Eggs
         *
         * For now this represents the total eggs
         * recorded during the selected dashboard period.
         *
         * This means:
         *   Today       -> today's eggs
         *   This Week   -> eggs produced this week
         *   This Month  -> eggs produced this month
         *   Any Day     -> eggs produced on that day
         */
        const periodEggs =
          filteredEggs.reduce(
            (
              sum: number,
              record: any
            ) =>
              sum +
              Number(
                record.egg_count || 0
              ),
            0
          );

        /*
         * Filter expenses by selected date.
         */
        const filteredExpenses =
          (expenses || []).filter(
            (record: any) => {
              const recordDate =
                record.expense_date;

              return (
                recordDate >= start &&
                recordDate <= end
              );
            }
          );

        const periodExpenses =
          filteredExpenses.reduce(
            (
              sum: number,
              record: any
            ) =>
              sum +
              Number(
                record.amount || 0
              ),
            0
          );

        /*
         * Filter sales by selected date.
         */
        const filteredSales =
          (sales || []).filter(
            (record: any) => {
              const recordDate =
                record.sale_date;

              return (
                recordDate >= start &&
                recordDate <= end
              );
            }
          );

        const periodRevenue =
          filteredSales.reduce(
            (
              sum: number,
              record: any
            ) =>
              sum +
              Number(
                record.total_amount || 0
              ),
            0
          );

        /*
         * Production percentage is retained for
         * compatibility with the existing dashboard.
         *
         * It is no longer displayed in the Hero.
         */
        const production =
          birds > 0
            ? Number(
                (
                  (periodEggs /
                    birds) *
                  100
                ).toFixed(2)
              )
            : 0;

        setCurrentBirds(
          Number(birds || 0)
        );

        setIsolatedBirds(
          Number(
            isolatedBirdsCount || 0
          )
        );

        setAvailableEggs(
          Number(
            periodEggs || 0
          )
        );

        setTotalFlocks(
          Number(
            flockCount || 0
          )
        );

        /*
         * Keep todayEggs for compatibility with
         * any existing component that may still
         * reference it.
         */
        setTodayEggs(
          Number(periodEggs || 0)
        );

        setTotalMortality(
          Number(mortality || 0)
        );

        setTotalExpenses(
          Number(
            periodExpenses || 0
          )
        );

        setTotalRevenue(
          Number(
            periodRevenue || 0
          )
        );

        setProfit(
          Number(
            periodRevenue -
              periodExpenses
          )
        );

        setProductionPercentage(
          production
        );

      } catch (error) {
        console.error(
          "Failed to load dashboard statistics:",
          error
        );
      }
    }

    load();
  }, [
    farmId,
    dateRange?.start,
    dateRange?.end,
  ]);

  return {
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
  };
}