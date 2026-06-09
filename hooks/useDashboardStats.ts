"use client";

import { useEffect, useState } from "react";

import {
  getTotalBirds,
  getTotalFlocks,
} from "@/lib/flocks";

export function useDashboardStats(
  farmId?: string
) {
  const [totalBirds, setTotalBirds] =
    useState(0);

  const [totalFlocks, setTotalFlocks] =
    useState(0);

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

      setTotalBirds(birds);
      setTotalFlocks(flocks);
    }

    load();
  }, [farmId]);

  return {
    totalBirds,
    totalFlocks,
  };
}