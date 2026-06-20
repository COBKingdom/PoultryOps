"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getEggProduction,
} from "@/lib/eggs";

export function useEggProduction(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    const result =
      await getEggProduction(
        farmId
      );

    setRecords(result);

    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [farmId]);

  return {
    records,
    loading,
    refresh,
  };
}