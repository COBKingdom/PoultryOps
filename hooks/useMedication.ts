"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getMedications,
} from "@/lib/medication";

export function useMedication(
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
        await getMedications(
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