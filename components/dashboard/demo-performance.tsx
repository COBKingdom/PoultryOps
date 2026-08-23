"use client";

import { Egg } from "lucide-react";

import RevenueChart from "@/components/analytics/revenue-chart";
import ProductionChart from "@/components/analytics/production-chart";
import DemoFlockShowcase from "@/components/dashboard/demo-flock-showcase";

type Props = {
  revenue: number;
  expenses: number;
  currency?: string;
  eggs: number;
  birds: number;
  farmId?: string;
};

/*
 * Farm performance section for the demo dashboard.
 *
 * Reuses the EXISTING RevenueChart and ProductionChart
 * (recharts) components from the analytics suite — no
 * new chart library, no new data source. They are simply
 * composed into a fresh, sales-ready layout and paired
 * with an attractive flock presentation.
 */
export default function DemoPerformance({
  revenue,
  expenses,
  currency,
  eggs,
  birds,
  farmId,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Egg
          size={20}
          className="text-amber-500"
        />
        <h2
          className="
            text-xl
            font-bold
            text-slate-900
          "
        >
          Farm Performance
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart
          revenue={revenue}
          expenses={expenses}
          currency={currency}
        />

        <ProductionChart
          eggs={eggs}
          birds={birds}
        />
      </div>

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
        <div className="mb-4 flex items-center gap-2">
          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-xl
              bg-green-100
            "
          >
            <Egg
              size={18}
              className="text-green-600"
            />
          </span>
          <h3
            className="
              text-lg
              font-semibold
              text-slate-900
            "
          >
            Active Flocks
          </h3>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Live flocks currently contributing to
          production on this farm.
        </p>

        <DemoFlockShowcase farmId={farmId} />
      </div>
    </section>
  );
}