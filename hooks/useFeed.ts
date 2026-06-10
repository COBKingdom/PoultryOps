"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFeedRecords,
} from "@/lib/feed";

export function useFeed(
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
        await getFeedRecords(
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