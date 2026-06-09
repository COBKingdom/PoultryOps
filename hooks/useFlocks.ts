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

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) return;

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

    load();
  }, [farmId]);

  return {
    flocks,
    loading,
  };
}