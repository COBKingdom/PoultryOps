"use client";

import {
  Bird,
  Egg,
  Wheat,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";

import KpiCard from "@/components/dashboard/kpi-card";
import DemoKpiCard from "@/components/dashboard/demo-kpi-card";
import type { CardTheme } from "@/components/dashboard/demo-kpi-card";

type Props = {
  currentBirds: number;
  isolatedBirds: number;
  availableEggs: number;
  totalFlocks: number;
  totalMortality: number;
  totalExpenses: number;
  totalRevenue: number;
  profit: number;
  productionPercentage: number;
  feedKg: number;
  fcr: number;
  currency?: string;
};

/*
 * Colourful-but-professional KPI grid.
 *
 * Palette (PoultryOps agricultural language):
 *   green  = healthy / performance (Birds, Profit)
 *   amber  = egg output            (Eggs)
 *   orange = feed / activity      (Feed)
 *   red    = mortality / critical (Mortality)
 *   purple = intelligence          (FCR efficiency)
 *   blue   = information          (Production)
 *
 * Financial cards reuse the existing KpiCard so their
 * green/red profit logic is preserved exactly.
 */
export default function DemoKpiGrid({
  currentBirds,
  isolatedBirds,
  availableEggs,
  totalFlocks,
  totalMortality,
  totalExpenses,
  totalRevenue,
  profit,
  productionPercentage,
  feedKg,
  fcr,
  currency,
}: Props) {
  const birdsTheme: CardTheme = {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    valueColor: "text-green-700",
  };

  const eggsTheme: CardTheme = {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    valueColor: "text-amber-700",
  };

  const feedTheme: CardTheme = {
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    valueColor: "text-orange-700",
  };

  const mortalityTheme: CardTheme = {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    valueColor: "text-rose-700",
  };

  const fcrTheme: CardTheme = {
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    valueColor: "text-indigo-700",
  };

  const productionTheme: CardTheme = {
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    valueColor: "text-cyan-700",
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Operational metrics (demo cards) */}

      <DemoKpiCard
        title="Available Birds"
        value={currentBirds}
        subtitle="Current birds on the farm"
        icon={Bird}
        theme={birdsTheme}
      />

      <DemoKpiCard
        title="Egg Production"
        value={availableEggs}
        subtitle="Eggs in the selected period"
        icon={Egg}
        theme={eggsTheme}
      />

      <DemoKpiCard
        title="Feed Consumption"
        value={feedKg}
        suffix=" kg"
        subtitle="Feed used in the selected period"
        icon={Wheat}
        theme={feedTheme}
      />

      <DemoKpiCard
        title="Mortality"
        value={totalMortality}
        subtitle="Cumulative bird losses"
        icon={AlertTriangle}
        theme={mortalityTheme}
      />

      <DemoKpiCard
        title="FCR"
        value={fcr}
        suffix=" kg/egg"
        subtitle="Feed conversion efficiency"
        icon={BarChart3}
        theme={fcrTheme}
      />

      <DemoKpiCard
        title="Production Rate"
        value={productionPercentage}
        suffix="%"
        subtitle="Hens laying today"
        icon={Activity}
        theme={productionTheme}
      />

      {/* Financial metrics (reuse existing KpiCard) */}

      <KpiCard
        title="Revenue"
        value={totalRevenue}
        currency={currency}
      />

      <KpiCard
        title="Expenses"
        value={totalExpenses}
        currency={currency}
      />

      <KpiCard
        title="Profit"
        value={profit}
        currency={currency}
      />
    </div>
  );
}