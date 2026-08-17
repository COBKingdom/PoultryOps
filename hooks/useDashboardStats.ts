"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAvailableBirds,
} from "@/lib/flocks";

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
         * They should NOT change when the financial/
         * production date filter changes.
         */
        const birds =
          await getAvailableBirds(
            farmId
          );

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
          eggs,
          expenses,
          sales,
          mortality,
        ] = await Promise.all([
          getEggProduction(farmId),
          getExpenses(farmId),
          getSales(farmId),
          getTotalMortality(farmId),
        ]);

        /*
         * Filter egg production by selected date.
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
         * Total eggs for selected period.
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

        /*
         * Total expenses for selected period.
         */
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

        /*
         * Total revenue for selected period.
         */
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
         * Production percentage.
         *
         * This represents eggs produced during
         * the selected period against the current
         * available bird population.
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
    todayEggs,
    totalMortality,
    totalExpenses,
    totalRevenue,
    profit,
    productionPercentage,
  };
}