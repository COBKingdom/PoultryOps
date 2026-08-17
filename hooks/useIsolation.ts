"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getIsolationRecords,
} from "@/lib/isolation";

export function useIsolation(
  farmId?: string
) {
  const [records, setRecords] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const refresh = useCallback(
    async () => {
      if (!farmId) {
        setRecords([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await getIsolationRecords(
            farmId
          );

        setRecords(result);
      } catch (err: any) {
        console.error(
          "Failed to load isolation records:",
          err
        );

        setError(
          err?.message ||
            "Failed to load isolation records."
        );
      } finally {
        setLoading(false);
      }
    },
    [farmId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    records,
    loading,
    error,
    refresh,
  };
}