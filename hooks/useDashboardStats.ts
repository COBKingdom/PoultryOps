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

import {
  getTotalMortality,
} from "@/lib/mortality";

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

  const [
    totalMortality,
    setTotalMortality,
  ] = useState(0);

  const [
    currentBirds,
    setCurrentBirds,
  ] = useState(0);

  useEffect(() => {
    async function load() {
      try {
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

        const mortality =
          await getTotalMortality(
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

        setTotalMortality(
          mortality
        );

        setCurrentBirds(
          birds - mortality
        );

      } catch (error) {
        console.error(
          "Dashboard Stats Error:",
          error
        );
      }
    }

    load();
  }, [farmId]);

  return {
    totalBirds,
    totalFlocks,
    todayEggs,
    totalMortality,
    currentBirds,
  };
}