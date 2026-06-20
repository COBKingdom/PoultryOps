"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getSales,
} from "@/lib/sales";

export function useSales(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    const result =
      await getSales(
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