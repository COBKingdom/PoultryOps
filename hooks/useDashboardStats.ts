"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getTotalBirds,
  getTotalFlocks,
} from "@/lib/flocks";

import {
  getTodayEggs,
} from "@/lib/eggs";

export function useDashboardStats(
  farmId?: string
) {
  const [
    totalBirds,
    setTotalBirds,
  ] = useState(0);

  const [
    totalFlocks,
    setTotalFlocks,
  ] = useState(0);

  const [
    todayEggs,
    setTodayEggs,
  ] = useState(0);

  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const birds =
        await getTotalBirds(
          farmId
        );

      const flocks =
        await getTotalFlocks(
          farmId
        );

      const eggs =
        await getTodayEggs(
          farmId
        );

      setTotalBirds(
        birds
      );

      setTotalFlocks(
        flocks
      );

      setTodayEggs(
        eggs
      );
    }

    load();
  }, [farmId]);

  return {
    totalBirds,
    totalFlocks,
    todayEggs,
  };
}