"use client";

import { useEffect, useState } from "react";

import { getFlocks } from "@/lib/flocks";

export function useFlocks(
  farmId?: string
) {
  const [flocks, setFlocks] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    if (!farmId) return;

    try {
      const result =
        await getFlocks(
          farmId
        );

      setFlocks(result);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [farmId]);

  return {
    flocks,
    loading,
    refresh,
  };
}
