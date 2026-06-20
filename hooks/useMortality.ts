"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getMortality,
} from "@/lib/mortality";

export function useMortality(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    const result =
      await getMortality(
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