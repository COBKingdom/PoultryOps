"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFeedIntelligence,
  type FeedIntelligencePeriod,
  type FeedIntelligenceResult,
} from "@/lib/feed-intelligence";

const EMPTY_RESULT:
  FeedIntelligenceResult = {
    totalFeedConsumedKg: 0,
    averageDailyFeedKg: 0,
    flockCount: 0,
    flocks: [],
  };

export function useFeedIntelligence(
  farmId?: string,
  period?: FeedIntelligencePeriod,
  flockId?: string
) {
  const [result, setResult] =
    useState<FeedIntelligenceResult>(
      EMPTY_RESULT
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  async function refresh() {
    if (
      !farmId ||
      !period
    ) {
      setResult(
        EMPTY_RESULT
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data =
        await getFeedIntelligence(
          farmId,
          period,
          flockId
        );

      setResult(data);
    } catch (error: any) {
      console.error(
        "Failed to load feed intelligence:",
        error
      );

      setError(
        error?.message ||
          "Unable to load feed intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [
    farmId,
    period?.from,
    period?.to,
    flockId,
  ]);

  return {
    ...result,
    loading,
    error,
    refresh,
  };
}