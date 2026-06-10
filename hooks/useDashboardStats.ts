"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getTotalBirds,
} from "@/lib/flocks";

import {
  getTodayEggs,
} from "@/lib/eggs";

import {
  getTotalMortality,
} from "@/lib/mortality";

import {
  getTotalExpenses,
} from "@/lib/expenses";

import {
  getTotalRevenue,
} from "@/lib/sales";

export function useDashboardStats(
  farmId?: string
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

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) return;

        const birds =
          await getTotalBirds(
            farmId
          );

        const mortality =
          await getTotalMortality(
            farmId
          );

        const eggs =
          await getTodayEggs(
            farmId
          );

        const expenses =
          await getTotalExpenses(
            farmId
          );

        const revenue =
          await getTotalRevenue(
            farmId
          );

        setCurrentBirds(
          birds - mortality
        );

        setTodayEggs(
          eggs
        );

        setTotalMortality(
          mortality
        );

        setTotalExpenses(
          expenses
        );

        setTotalRevenue(
          revenue
        );

        setProfit(
          revenue -
            expenses
        );

      } catch (error) {
        console.error(error);
      }
    }

    load();
  }, [farmId]);

  return {
    currentBirds,
    todayEggs,
    totalMortality,
    totalExpenses,
    totalRevenue,
    profit,
  };
}