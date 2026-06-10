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

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) return;

        const result =
          await getSales(
            farmId
          );

        setRecords(result);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [farmId]);

  return {
    records,
    loading,
  };
}