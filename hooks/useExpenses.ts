"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getExpenses,
} from "@/lib/expenses";

export function useExpenses(
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
          await getExpenses(
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