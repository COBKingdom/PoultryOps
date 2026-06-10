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
  getTodayFeed,
} from "@/lib/feed";

import {
  getTotalExpenses,
} from "@/lib/expenses";

export function useDashboardStats(
  farmId?: string
) {
  const [currentBirds, setCurrentBirds] =
    useState(0);

  const [todayEggs, setTodayEggs] =
    useState(0);

  const [todayFeed, setTodayFeed] =
    useState(0);

  const [
    totalMortality,
    setTotalMortality,
  ] = useState(0);

  const [
    totalExpenses,
    setTotalExpenses,
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

        const feed =
          await getTodayFeed(
            farmId
          );

        const expenses =
          await getTotalExpenses(
            farmId
          );

        setCurrentBirds(
          birds - mortality
        );

        setTodayEggs(
          eggs
        );

        setTodayFeed(
          feed
        );

        setTotalMortality(
          mortality
        );

        setTotalExpenses(
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
    todayFeed,
    totalMortality,
    totalExpenses,
  };
}