"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Brain,
  CalendarDays,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

import {
  getFarmFlocks,
} from "@/lib/flocks";

import {
  useFeedIntelligence,
} from "@/hooks/useFeedIntelligence";

import FeedIntelligenceKpis from "@/components/feed-intelligence/feed-intelligence-kpis";

import FlockFeedPerformance from "@/components/feed-intelligence/flock-feed-performance";

import { useAuth } from "@/contexts/AuthContext";

import AppShell from "@/components/layout/app-shell";

type Flock = {
  id: string;
  flock_name: string;
  quantity: number;
};

function formatDateInput(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultFromDate() {
  const date =
    new Date();

  date.setDate(
    date.getDate() - 6
  );

  return formatDateInput(
    date
  );
}

function getToday() {
  return formatDateInput(
    new Date()
  );
}

export default function FeedIntelligencePage() {
  const {
    profile,
    loading: authLoading,
  } = useAuth();

  const farmId =
    profile?.farm_id;

  const [flocks, setFlocks] =
    useState<Flock[]>([]);

  const [flockId, setFlockId] =
    useState("");

  const [fromDate, setFromDate] =
    useState(
      getDefaultFromDate()
    );

  const [toDate, setToDate] =
    useState(
      getToday()
    );

  const [loadingFlocks, setLoadingFlocks] =
    useState(true);

  const period = useMemo(
    () => ({
      from: fromDate,
      to: toDate,
    }),
    [
      fromDate,
      toDate,
    ]
  );

  const {
    totalFeedConsumedKg,
    averageDailyFeedKg,
    flockCount,
    flocks:
      performance,
    loading,
    error,
    refresh,
  } =
    useFeedIntelligence(
      farmId,
      period,
      flockId || undefined
    );

  useEffect(() => {
    async function loadFlocks() {
      if (!farmId) {
        setFlocks([]);
        setLoadingFlocks(false);
        return;
      }

      try {
        setLoadingFlocks(true);

        const data =
          await getFarmFlocks(
            farmId
          );

        setFlocks(
          (data || []) as Flock[]
        );
      } catch (error) {
        console.error(
          "Failed to load flocks:",
          error
        );

        setFlocks([]);
      } finally {
        setLoadingFlocks(false);
      }
    }

    loadFlocks();
  }, [farmId]);

  const selectedFlock =
    performance.length === 1
      ? performance[0]
      : undefined;

  function setPeriod(
    days: number
  ) {
    const end =
      new Date();

    const start =
      new Date();

    start.setDate(
      end.getDate() -
        (days - 1)
    );

    setFromDate(
      formatDateInput(start)
    );

    setToDate(
      formatDateInput(end)
    );
  }

  /*
   * ---------------------------------------------------------
   * AUTH LOADING
   * ---------------------------------------------------------
   *
   * Keep the page inside AppShell so the navigation structure
   * remains consistent with every other PoultryOps sub-unit.
   */
  if (authLoading) {
    return (
      <AppShell>
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">
                Loading Feed Intelligence...
              </p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * FARM NOT AVAILABLE
   * ---------------------------------------------------------
   */
  if (!farmId) {
    return (
      <AppShell>
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Brain
                size={42}
                className="mx-auto text-slate-400"
              />

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Feed Intelligence
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your farm profile is not available yet.
              </p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * FEED INTELLIGENCE
   * ---------------------------------------------------------
   */
  return (
    <AppShell
      email={
        profile?.email ||
        undefined
      }
    >
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-3">

                <div className="rounded-2xl bg-blue-600 p-3 shadow-sm">
                  <Brain
                    size={24}
                    className="text-white"
                  />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Feed Intelligence
                  </h1>

                  <p className="mt-1 text-slate-500">
                    Understand how your flocks are actually consuming feed.
                  </p>
                </div>

              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                refresh()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>

          {/* Filters */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center gap-2">

              <BarChart3
                size={19}
                className="text-blue-600"
              />

              <h2 className="font-bold text-slate-900">
                Analysis Period
              </h2>

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

              {/* Flock */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Flock
                </label>

                <div className="relative">
                  <select
                    value={flockId}
                    onChange={(e) =>
                      setFlockId(
                        e.target.value
                      )
                    }
                    disabled={
                      loadingFlocks
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      All Flocks
                    </option>

                    {flocks.map(
                      (flock) => (
                        <option
                          key={
                            flock.id
                          }
                          value={
                            flock.id
                          }
                        >
                          {
                            flock.flock_name
                          }
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* From */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  From
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={
                      fromDate
                    }
                    max={
                      toDate
                    }
                    onChange={(e) =>
                      setFromDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* To */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  To
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={
                      toDate
                    }
                    min={
                      fromDate
                    }
                    max={
                      getToday()
                    }
                    onChange={(e) =>
                      setToDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Quick periods */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Quick Period
                </label>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setPeriod(7)
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPeriod(30)
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    30 Days
                  </button>

                </div>
              </div>

            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* KPI section */}
          <FeedIntelligenceKpis
            totalFeedConsumedKg={
              totalFeedConsumedKg
            }
            averageDailyFeedKg={
              averageDailyFeedKg
            }
            currentFlockCount={
              flockCount
            }
            selectedFlockBirds={
              selectedFlock?.startingBirds
            }
          />

          {/* Explanation */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">

            <p className="text-sm text-blue-900">
              <span className="font-semibold">
                V1 Actual Consumption:
              </span>{" "}
              These figures are based on feed
              consumption records entered into
              PoultryOps. Expected consumption and
              efficiency analysis will be added in
              the next intelligence layer.
            </p>

          </div>

          {/* Performance */}
          <FlockFeedPerformance
            flocks={performance}
          />

        </div>
      </main>
    </AppShell>
  );
}