"use client";

import { useEffect, useState } from "react";

import { getFarmReport, FarmReport } from "@/lib/reports";
import { DateRangeSelection } from "@/lib/date-ranges";

export function useReports(
  farmId?: string,
  dateRange?: DateRangeSelection
) {
  const [report, setReport] = useState<FarmReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the range from the selection, or default to today
  const rangeStart = dateRange?.range.start;
  const rangeEnd = dateRange?.range.end;

  useEffect(() => {
    async function load() {
      try {
        if (!farmId) {
          setLoading(false);
          return;
        }

        // Build the DateRange to pass to the report engine
        const range = {
          start: rangeStart || "",
          end: rangeEnd || "",
        };

        if (!range.start || !range.end) {
          setLoading(false);
          return;
        }

        const result = await getFarmReport(farmId, range);
        setReport(result);
      } catch (error) {
        console.error("Reports Error:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [farmId, rangeStart, rangeEnd]);

  return {
    report,
    loading,
  };
}