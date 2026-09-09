"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Brain,
  Calculator,
  CalendarDays,
  ChevronDown,
  Clock3,
  Egg,
  Package,
  RefreshCw,
  Save,
  Sparkles,
  Wheat,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { useFeedIntelligence } from "@/hooks/useFeedIntelligence";

import { getFarmFlocks } from "@/lib/flocks";

import FeedIntelligenceKpis from "@/components/feed-intelligence/feed-intelligence-kpis";
import FlockFeedPerformance from "@/components/feed-intelligence/flock-feed-performance";

type Flock = {
  id: string;
  flock_name: string;
  quantity?: number;
  startingBirds?: number;
};

type ProgrammeRow = {
  week: number;
  kgPerBird: string;
};

const PROGRAMME_WEEKS = Array.from(
  { length: 12 },
  (_, index) => ({
    week: index + 1,
    kgPerBird: "",
  })
);

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return formatDateInput(date);
}

function getToday() {
  return formatDateInput(new Date());
}

function formatNumber(value: number, decimals = 2) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `₦${formatNumber(value, 0)}`;
  }
}

export default function FeedIntelligencePage() {
  const { user, profile, loading: authLoading } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const farmId = farm?.id || profile?.farm_id;

  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loadingFlocks, setLoadingFlocks] = useState(true);

  const [flockId, setFlockId] = useState("");
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getToday());

  const [activeTab, setActiveTab] = useState<
    "calculator" | "analytics"
  >("calculator");

  // Calculator inputs are deliberately farm-specific. We do not seed
  // feeding recommendations, bird counts, bag sizes or prices.
  const [calculatorFlockId, setCalculatorFlockId] = useState("");
  const [numberOfWeeks, setNumberOfWeeks] = useState("");

  const [programme, setProgramme] =
    useState<ProgrammeRow[]>(PROGRAMME_WEEKS);

  const [useCost, setUseCost] = useState(false);
  const [feedPricePerKg, setFeedPricePerKg] = useState("");
  const [bagSizeKg, setBagSizeKg] = useState("");
  const [bagPrice, setBagPrice] = useState("");

  const [calculated, setCalculated] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);

  const period = useMemo(
    () => ({
      from: fromDate,
      to: toDate,
    }),
    [fromDate, toDate]
  );

  const {
    totalFeedConsumedKg,
    averageDailyFeedKg,
    flockCount,
    flocks: performance,
    loading,
    error,
    refresh,
  } = useFeedIntelligence(
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

        const data = await getFarmFlocks(farmId);

        setFlocks((data || []) as Flock[]);
      } catch (loadError) {
        console.error(
          "Failed to load flocks:",
          loadError
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

  const calculatorFlock = useMemo(
    () =>
      flocks.find(
        (flock) => flock.id === calculatorFlockId
      ),
    [flocks, calculatorFlockId]
  );

  const calculatorBirds =
    typeof calculatorFlock?.quantity === "number"
      ? Math.max(0, calculatorFlock.quantity)
      : 0;

  const calculatorWeekCount = Math.min(
    12,
    Math.max(0, Number(numberOfWeeks) || 0)
  );

  const calculationRows = useMemo(() => {
    const birds = calculatorBirds;

    return programme
      .slice(0, calculatorWeekCount)
      .map((row) => {
        const kgPerBird = Number(row.kgPerBird);

        return {
          ...row,
          kgPerBird,
          feedRequired:
            Number.isFinite(kgPerBird) && kgPerBird >= 0
              ? birds * kgPerBird
              : 0,
        };
      });
  }, [calculatorBirds, calculatorWeekCount, programme]);

  const hasCompleteProgramme =
    Boolean(calculatorFlockId) &&
    calculatorBirds > 0 &&
    calculatorWeekCount > 0 &&
    calculationRows.length === calculatorWeekCount &&
    calculationRows.every(
      (row) => row.kgPerBird > 0
    );

  const calculationResult = useMemo(() => {
    const totalFeed = calculationRows.reduce(
      (sum, row) => sum + row.feedRequired,
      0
    );

    const averagePerWeek =
      calculatorWeekCount > 0
        ? totalFeed / calculatorWeekCount
        : 0;

    const perBird =
      calculatorBirds > 0
        ? totalFeed / calculatorBirds
        : 0;

    const bagSize = Math.max(0, Number(bagSizeKg) || 0);
    const bags =
      bagSize > 0
        ? Math.ceil(totalFeed / bagSize)
        : 0;

    const kgPrice = Math.max(
      0,
      Number(feedPricePerKg) || 0
    );
    const pricePerBag = Math.max(
      0,
      Number(bagPrice) || 0
    );

    const costByKg = totalFeed * kgPrice;
    const costByBag = bags * pricePerBag;

    return {
      totalFeed,
      averagePerWeek,
      perBird,
      bags,
      costByKg,
      costByBag,
    };
  }, [
    calculationRows,
    calculatorBirds,
    calculatorWeekCount,
    bagSizeKg,
    feedPricePerKg,
    bagPrice,
  ]);

  function updateProgramme(
    week: number,
    value: string
  ) {
    setProgramme((current) =>
      current.map((row) =>
        row.week === week
          ? { ...row, kgPerBird: value }
          : row
      )
    );
    setCalculated(false);
  }

  function resetCalculator() {
    setCalculatorFlockId("");
    setNumberOfWeeks("");
    setProgramme(PROGRAMME_WEEKS);
    setUseCost(false);
    setFeedPricePerKg("");
    setBagSizeKg("");
    setBagPrice("");
    setCalculated(false);
  }

  function calculateFeed() {
    if (!hasCompleteProgramme) {
      setCalculated(false);
      return;
    }

    setCalculated(true);
  }

  function answerFeedQuestion() {
    const question = askQuestion.trim().toLowerCase();

    if (!question) {
      setAskAnswer(
        "Enter a question about the actual feed data shown for this farm."
      );
      return;
    }

    const selectedPerformance =
      flockId && performance.length === 1
        ? performance[0]
        : undefined;

    if (
      question.includes("average") &&
      (question.includes("daily") || question.includes("day"))
    ) {
      setAskAnswer(
        `For the selected analysis period, PoultryOps recorded an average daily feed consumption of ${formatNumber(averageDailyFeedKg)} kg.`
      );
      return;
    }

    if (
      question.includes("how many") &&
      (question.includes("flock") || question.includes("flocks"))
    ) {
      setAskAnswer(
        `There are ${formatNumber(flockCount, 0)} active flock${flockCount === 1 ? "" : "s"} in the current Feed Intelligence result.`
      );
      return;
    }

    if (
      question.includes("how many") &&
      (question.includes("bird") || question.includes("birds"))
    ) {
      if (selectedPerformance) {
        setAskAnswer(
          `The selected flock has ${formatNumber(selectedPerformance.startingBirds, 0)} starting birds in the current Feed Intelligence result.`
        );
      } else {
        setAskAnswer(
          "Select one flock in Consumption Analytics if you want a flock-specific bird count."
        );
      }
      return;
    }

    if (
      question.includes("feed") &&
      (question.includes("consume") ||
        question.includes("used") ||
        question.includes("consumption") ||
        question.includes("how much"))
    ) {
      setAskAnswer(
        `For the selected analysis period, PoultryOps recorded ${formatNumber(totalFeedConsumedKg)} kg of actual feed consumption.`
      );
      return;
    }

    setAskAnswer(
      "I can currently answer questions from the actual Feed Intelligence result: feed consumed, average daily consumption, flock count and a selected flock's starting birds. I will not invent an answer where the required farm data is not available."
    );
  }

  function setPeriod(days: number) {
    const end = new Date();
    const start = new Date();

    start.setDate(
      end.getDate() - (days - 1)
    );

    setFromDate(formatDateInput(start));
    setToDate(formatDateInput(end));
  }

  const currency = farm?.currency || "NGN";

  if (authLoading || farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-600"
            />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading Feed Intelligence...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!farmId) {
    return (
      <AppShell email={user?.email}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Brain size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Feed Intelligence
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your farm profile is not available yet.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email}>
      <main className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-[1500px] space-y-5">
          {/* Page header */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                <Brain size={27} strokeWidth={2} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  PoultryOps Intelligence
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Feed Intelligence
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-[15px]">
                  Calculate. Plan. Understand your feed use.
                  Make better decisions for a more profitable farm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Turn feed data into decisions
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Calculate requirements, compare usage and plan ahead.
                </p>
              </div>
            </div>
          </div>

          {/* Workspace navigation */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <div className="flex min-w-max items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("calculator")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "calculator"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <Calculator size={16} />
                Feed Calculator
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "analytics"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <BarChart3 size={16} />
                Consumption Analytics
              </button>

              <div className="ml-auto hidden items-center gap-1 px-3 text-xs font-medium text-slate-400 lg:flex">
                <Clock3 size={14} />
                Current farm data
              </div>
            </div>
          </div>

          {activeTab === "calculator" ? (
            <>
              {/* Calculator */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.03fr)_minmax(420px,0.97fr)]">
                {/* Input card */}
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Calculator size={21} />
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-slate-950">
                            Feed Requirement Calculator
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Estimate feed required for a flock over a selected period.
                          </p>
                        </div>
                      </div>

                      <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:inline-flex">
                        Transparent calculation
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-6">
                    {/* Farm-specific flock inputs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Farm Flock
                        </span>
                        <div className="relative">
                          <select
                            value={calculatorFlockId}
                            onChange={(e) => {
                              setCalculatorFlockId(e.target.value);
                              setCalculated(false);
                            }}
                            disabled={loadingFlocks}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                          >
                            <option value="">Select a flock</option>
                            {flocks.map((flock) => (
                              <option key={flock.id} value={flock.id}>
                                {flock.flock_name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Select a flock from your farm records.
                        </p>
                      </label>

                      <div>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Current Birds
                        </span>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-800">
                          {calculatorFlock
                            ? formatNumber(calculatorBirds, 0)
                            : "—"}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Taken from the selected flock record.
                        </p>
                      </div>

                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Number of Weeks to Plan
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="e.g. 6"
                          value={numberOfWeeks}
                          onChange={(e) => {
                            setNumberOfWeeks(e.target.value);
                            setCalculated(false);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          Enter the planning horizon. PoultryOps will not assume a number of weeks.
                        </p>
                      </label>
                    </div>

                    {/* Programme */}
                    <div>
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Feed Programme
                            <span className="ml-1 font-medium text-slate-400">
                              (kg per bird per week)
                            </span>
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Enter the validated feed programme used by this farm. PoultryOps does not supply default feeding values.
                          </p>
                        </div>

                        <Wheat size={18} className="text-blue-500" />
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-[1fr_1.4fr] bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          <span>Week</span>
                          <span>Feed per bird (kg)</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {programme
                            .slice(0, calculatorWeekCount)
                            .map((row) => (
                              <div
                                key={row.week}
                                className="grid grid-cols-[1fr_1.4fr] items-center px-4 py-2.5"
                              >
                                <span className="text-sm font-semibold text-slate-700">
                                  Week {row.week}
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g. 0.50"
                                  value={row.kgPerBird}
                                  onChange={(e) =>
                                    updateProgramme(
                                      row.week,
                                      e.target.value
                                    )
                                  }
                                  className="max-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />
                              </div>
                            ))}
                        </div>

                        {calculatorWeekCount === 0 && (
                          <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
                            Enter the number of weeks above to add the farm's weekly feed programme.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Optional Cost Calculation
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Enter the actual feed pricing you want to use for this farm calculation.
                          </p>
                        </div>

                        <button
                          type="button"
                          aria-label="Toggle cost calculation"
                          onClick={() => setUseCost((value) => !value)}
                          className={`relative h-6 w-11 rounded-full transition ${
                            useCost
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                              useCost ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>

                      {useCost && (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <label>
                            <span className="mb-2 block text-xs font-semibold text-slate-500">
                              Actual Feed Price / kg
                            </span>
                            <div className="flex overflow-hidden rounded-xl border border-slate-200">
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 650"
                                value={feedPricePerKg}
                                onChange={(e) =>
                                  setFeedPricePerKg(e.target.value)
                                }
                                className="min-w-0 flex-1 px-3 py-2.5 text-sm font-semibold outline-none"
                              />
                              <span className="flex items-center bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                                / kg
                              </span>
                            </div>
                          </label>

                          <label>
                            <span className="mb-2 block text-xs font-semibold text-slate-500">
                              Actual Bag Size
                            </span>
                            <div className="flex overflow-hidden rounded-xl border border-slate-200">
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 25"
                                value={bagSizeKg}
                                onChange={(e) =>
                                  setBagSizeKg(e.target.value)
                                }
                                className="min-w-0 flex-1 px-3 py-2.5 text-sm font-semibold outline-none"
                              />
                              <span className="flex items-center bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                                kg
                              </span>
                            </div>
                          </label>

                          <label>
                            <span className="mb-2 block text-xs font-semibold text-slate-500">
                              Actual Bag Price
                            </span>
                            <div className="flex overflow-hidden rounded-xl border border-slate-200">
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 16000"
                                value={bagPrice}
                                onChange={(e) =>
                                  setBagPrice(e.target.value)
                                }
                                className="min-w-0 flex-1 px-3 py-2.5 text-sm font-semibold outline-none"
                              />
                              <span className="flex items-center bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                                / bag
                              </span>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setProgramme(PROGRAMME_WEEKS);
                          setCalculated(false);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <RefreshCw size={16} />
                        Reset Programme
                      </button>

                      <button
                        type="button"
                        onClick={calculateFeed}
                        className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <Calculator size={17} />
                        Calculate Feed
                      </button>
                    </div>
                  </div>
                </section>

                {/* Results card */}
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <BarChart3 size={21} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">
                          Calculation Results
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Calculated only from the selected flock and programme values you provide.
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        calculated
                          ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border border-amber-100 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {calculated
                        ? "Calculation complete"
                        : "Changes not calculated"}
                    </span>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    {!calculated ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <Calculator size={22} />
                        </div>
                        <h3 className="mt-4 font-bold text-slate-900">
                          Ready for your farm figures
                        </h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                          Select a flock, enter the planning period and enter the farm's validated weekly feed programme. Nothing is assumed by PoultryOps.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-5 text-white shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                            Farm-specific feed requirement
                          </p>
                          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                            {formatNumber(calculationResult.totalFeed)} kg
                          </p>
                          <p className="mt-1 text-sm text-blue-100">
                            {calculatorFlock?.flock_name || "Selected flock"} · {formatNumber(calculatorBirds, 0)} birds · {calculatorWeekCount} weeks
                          </p>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-white/10 p-4">
                              <p className="text-xs text-blue-100">Feed / bird</p>
                              <p className="mt-1 text-xl font-bold">
                                {formatNumber(calculationResult.perBird)} kg
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                              <p className="text-xs text-blue-100">Average / week</p>
                              <p className="mt-1 text-xl font-bold">
                                {formatNumber(calculationResult.averagePerWeek)} kg
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                              <p className="text-xs text-blue-100">Bags required</p>
                              <p className="mt-1 text-xl font-bold">
                                {calculationResult.bags > 0
                                  ? formatNumber(calculationResult.bags, 0)
                                  : "—"}
                              </p>
                              <p className="mt-0.5 text-xs text-blue-100">
                                {bagSizeKg ? `${formatNumber(Number(bagSizeKg))} kg bags` : "Bag size not entered"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                              <p className="text-xs text-blue-100">Estimated cost</p>
                              <p className="mt-1 text-xl font-bold">
                                {useCost && calculationResult.costByKg > 0
                                  ? formatCurrency(calculationResult.costByKg, currency)
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                Calculation Breakdown
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Every result is calculated from the values entered for this farm.
                              </p>
                            </div>
                            <span className="text-xs font-bold text-blue-600">
                              {calculatorFlock?.flock_name || "Selected flock"}
                            </span>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="grid grid-cols-[0.7fr_1.35fr_0.9fr] bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:px-4">
                              <span>Week</span>
                              <span>Calculation</span>
                              <span className="text-right">Feed Required</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {calculationRows.map((row) => (
                                <div
                                  key={row.week}
                                  className="grid grid-cols-[0.7fr_1.35fr_0.9fr] items-center px-3 py-2.5 text-xs sm:px-4 sm:text-sm"
                                >
                                  <span className="font-semibold text-slate-700">
                                    Week {row.week}
                                  </span>
                                  <span className="text-slate-600">
                                    {formatNumber(calculatorBirds, 0)} × {formatNumber(row.kgPerBird)} kg
                                  </span>
                                  <span className="text-right font-bold text-slate-900">
                                    {formatNumber(row.feedRequired)} kg
                                  </span>
                                </div>
                              ))}

                              <div className="grid grid-cols-[0.7fr_1.35fr_0.9fr] items-center bg-blue-50 px-3 py-3 sm:px-4">
                                <span className="font-bold text-blue-900">Total</span>
                                <span />
                                <span className="text-right font-bold text-blue-700">
                                  {formatNumber(calculationResult.totalFeed)} kg
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <Wheat
                        size={17}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                      <p className="text-xs leading-5 text-amber-800">
                        <span className="font-bold">Data rule:</span> PoultryOps does not assume a universal feed programme. Enter the programme actually used or approved for this farm before calculating a requirement.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Farm intelligence snapshot */}
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                      Existing PoultryOps Data
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      Actual Feed Consumption
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Compare your calculated requirement with real consumption
                      recorded in PoultryOps.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("analytics");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <BarChart3 size={16} />
                    Open Consumption Analytics
                  </button>
                </div>
              </section>

              {/* Future intelligence cards — deliberately non-functional */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm md:col-span-3">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Sparkles size={19} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                          Ask Feed Intelligence
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          Ask about the actual feed data
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                          Start with questions PoultryOps can answer directly from the current Feed Intelligence result. It will not invent figures when the required farm data is unavailable.
                        </p>
                      </div>
                    </div>

                    <div className="w-full lg:max-w-2xl">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={askQuestion}
                          onChange={(e) => setAskQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              answerFeedQuestion();
                            }
                          }}
                          placeholder="e.g. How much feed did we consume?"
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <button
                          type="button"
                          onClick={answerFeedQuestion}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <Sparkles size={16} />
                          Ask
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "How much feed did we consume?",
                          "What was our average daily feed?",
                          "How many active flocks do we have?",
                        ].map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => {
                              setAskQuestion(question);
                              setAskAnswer(null);
                            }}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            {question}
                          </button>
                        ))}
                      </div>

                      {askAnswer && (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                          <span className="font-bold">PoultryOps:</span>{" "}
                          {askAnswer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Package size={19} />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">
                    Stock vs Requirement
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Compare projected feed needs against current farm stock
                    and identify shortages before they happen.
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Next planning layer
                  </span>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Save size={19} />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">
                    Saved Feed Programmes
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Save proven feeding programmes so calculations can be
                    repeated without re-entering assumptions.
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Next planning layer
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Existing actual-consumption analytics, redesigned */}
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <BarChart3 size={21} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">
                          Consumption Analytics
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Actual feed consumption recorded by your farm.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPeriod(7)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod(30)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => refresh()}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      <RefreshCw
                        size={14}
                        className={loading ? "animate-spin" : ""}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <label className="md:col-span-1">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Flock
                    </span>
                    <div className="relative">
                      <select
                        value={flockId}
                        onChange={(e) =>
                          setFlockId(e.target.value)
                        }
                        disabled={loadingFlocks}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">All Flocks</option>
                        {flocks.map((flock) => (
                          <option
                            key={flock.id}
                            value={flock.id}
                          >
                            {flock.flock_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      From
                    </span>
                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        value={fromDate}
                        max={toDate}
                        onChange={(e) =>
                          setFromDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      To
                    </span>
                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        value={toDate}
                        min={fromDate}
                        max={getToday()}
                        onChange={(e) =>
                          setToDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </label>

                  <div>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Quick Period
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPeriod(7)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriod(30)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        30 Days
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <FeedIntelligenceKpis
                totalFeedConsumedKg={totalFeedConsumedKg}
                averageDailyFeedKg={averageDailyFeedKg}
                currentFlockCount={flockCount}
                selectedFlockBirds={
                  selectedFlock?.startingBirds
                }
              />

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                <p className="text-sm leading-6 text-blue-900">
                  <span className="font-bold">
                    Current actual-consumption layer:
                  </span>{" "}
                  These figures are based on feed consumption records entered
                  into PoultryOps. The calculator above is a planning tool that
                  uses the selected flock and farm-specific programme values you
                  provide. Future intelligence layers will compare expected
                  requirements with actual consumption automatically.
                </p>
              </div>

              <FlockFeedPerformance flocks={performance} />
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
