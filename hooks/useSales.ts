"use client";

import { useCallback, useEffect, useState } from "react";
import { getSales } from "@/lib/sales";

export function useSales(farmId?: string) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!farmId) {
      setRecords([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await getSales(farmId);
      setRecords(result ?? []);
      setError(null);
    } catch (err) {
      console.error("Failed to load sales records:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales records."
      );
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    records,
    loading,
    refresh,
    error,
  };
}