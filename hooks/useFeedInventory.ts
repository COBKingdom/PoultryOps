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

  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const result =
        await getFeedInventory(
          farmId
        );

      setRecords(result);

      setLoading(false);
    }

    load();
  }, [farmId]);

  return {
    records,
    loading,
  };
}