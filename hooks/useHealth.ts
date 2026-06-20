"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getHealthRecords,
} from "@/lib/health";

export function useHealth(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    const result =
      await getHealthRecords(
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