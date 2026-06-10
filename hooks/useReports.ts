"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFarmReport,
} from "@/lib/reports";

export function useReports(
  farmId?: string
) {
  const [report, setReport] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) {
          setLoading(false);
          return;
        }

        const result =
          await getFarmReport(
            farmId
          );

        setReport(result);

      } catch (error) {
        console.error(
          "Reports Error:",
          error
        );

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [farmId]);

  return {
    report,
    loading,
  };
}