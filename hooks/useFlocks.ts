"use client";

import { useEffect, useState } from "react";

import { getFlocks } from "@/lib/flocks";

export function useFlocks(
  farmId?: string,
  includeArchived = false
) {
  const [flocks, setFlocks] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  async function refresh() {
    if (!farmId) {
      setFlocks([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const result =
        await getFlocks(
          farmId,
          includeArchived
        );

      setFlocks(result || []);

    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load flocks");
      setError(error);
      console.error("Error loading flocks:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [farmId, includeArchived]);

  return {
    flocks,
    loading,
    error,
    refresh,
  };
}
