"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFeedInventory,
} from "@/lib/feedInventory";

export function useFeedInventory(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    const result =
      await getFeedInventory(
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
