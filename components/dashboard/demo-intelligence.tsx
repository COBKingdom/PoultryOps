"use client";

import {
  PiggyBank,
  Wheat,
  AlertTriangle,
  TrendingUp,
  Sprout,
  BookCheck,
  ShieldCheck,
} from "lucide-react";

import FarmInsights from "@/components/analytics/farm-insights";
import { formatCurrency } from "@/lib/currency";

type Props = {
  currentBirds: number;
  totalMortality: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  productionPercentage: number;
  feedKg: number;
  fcr: number;
  currency?: string;
};

function InsightCard({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: any;
  title: string;
  detail: string;
  tone: "green" | "amber" | "red" | "blue" | "purple";
}) {
  const toneMap: Record<string, string> = {
    green: "bg-green-50 text-green-700 ring-green-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    purple:
      "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };

  const iconMap: Record<string, string> = {
    green: "text-green-500",
    amber: "text-amber-500",
    red: "text-rose-500",
    blue: "text-blue-500",
    purple: "text-indigo-500",
  };

  return (
    <div
      className={`
        flex
        items-start
        gap-3
        rounded-2xl
        p-4
        ring-1
        ${toneMap[tone]}
      `}
    >
      <div
        className="
          flex
          h-6
          w-6
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-white/50"
      >
        <Icon
          size={14}
          className={iconMap[tone]}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase">
          {title}
        </p>
        <p className="mt-0.5 text-sm">
          {detail}
        </p>
      </div>
    </div>
  );
}

/*
 * PoultryOps Intelligence section for the demo
 * dashboard.
 *
 * Reuses the existing FarmInsights component for the
 * automated observations, then adds richer
 * commentary. Every metric is derived from real
 * demo-farm data — nothing is hard-coded.
 */
export default function DemoIntelligence({
  currentBirds,
  totalMortality,
  totalRevenue,
  totalExpenses,
  profit,
  productionPercentage,
  feedKg,
  fcr,
  currency,
}: Props) {
  const mortalityRate =
    currentBirds + totalMortality > 0
      ? ((totalMortality /
          (currentBirds + totalMortality)) *
        100
      ).toFixed(1)
      : "0";

  const profitCurrency = formatCurrency(profit, {
    currency,
  });

  const isProfitable = profit >= 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <BookCheck
          size={20}
          className="text-indigo-500"
        />
        <h2
          className="
            text-xl
            font-bold
            text-slate-900
          "
        >
          PoultryOps Intelligence
        </h2>
      </div>

      <p className="text-sm text-slate-500">
        AI-driven observations distilled from your
        real-time farm data.
      </p>

      {/* Reused automated observations */}
      <FarmInsights
        productionPercentage={productionPercentage}
        totalMortality={totalMortality}
        currentBirds={currentBirds}
        totalRevenue={totalRevenue}
        totalExpenses={totalExpenses}
      />

      {/* Enhanced commentary */}
      <div
        className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
        "
      >
        <h3
          className="
            mb-4
            text-lg
            font-semibold
            text-slate-900
          "
        >
          Performance Summary
        </h3>

        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3"
        >
          <InsightCard
            icon={PiggyBank}
            title="Financial Health"
            detail={
              isProfitable
                ? `Farm is operating in the green with ${profitCurrency} profit this period.`
                : `Farm is operating at a loss of ${profitCurrency} this period.`
            }
            tone={isProfitable ? "green" : "red"}
          />

          <InsightCard
            icon={Sprout}
            title="Feed Efficiency"
            detail={
              feedKg > 0
                ? `Converted ${feedKg.toFixed(
                    1
                  )} kg of feed into ${productionPercentage}% production (FCR ${fcr.toFixed(
                    3
                  )}).`
                : "No feed records yet for this period."
            }
            tone={fcr < 0.06 ? "green" : "amber"}
          />

          <InsightCard
            icon={TrendingUp}
            title="Production"
            detail={
              productionPercentage >= 70
                ? `Production rate at ${productionPercentage}% - above the 70% target.`
                : `Production rate at ${productionPercentage}% - below the 70% target.`
            }
            tone={
              productionPercentage >= 70
                ? "green"
                : "amber"
            }
          />

          <InsightCard
            icon={AlertTriangle}
            title="Mortality Watch"
            detail={
              Number(mortalityRate) <= 5
                ? `Mortality rate at ${mortalityRate}% - within the acceptable 5% threshold.`
                : `Mortality rate at ${mortalityRate}% - requires attention.`
            }
            tone={
              Number(mortalityRate) <= 5
                ? "green"
                : "red"
            }
          />

          <InsightCard
            icon={Wheat}
            title="Feed Status"
            detail={
              feedKg > 0
                ? `Consumed ${feedKg.toFixed(
                    1
                  )} kg of feed this period.`
                : "No feed consumption recorded yet."
            }
            tone={feedKg > 0 ? "blue" : "amber"}
          />

          <InsightCard
            icon={ShieldCheck}
            title="Stock Health"
            detail={`${currentBirds} birds currently available across the flock.`}
            tone="blue"
          />
        </div>
      </div>
    </section>
  );
}