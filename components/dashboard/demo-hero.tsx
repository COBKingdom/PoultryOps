"use client";

import {
  Bird,
  Egg,
  Layers3,
  Activity,
} from "lucide-react";

import {
  formatNumber,
} from "@/lib/currency";

type Props = {
  currentBirds: number;
  isolatedBirds: number;
  availableEggs: number;
  totalFlocks: number;
  productionPercentage: number;
};

function StatPill({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        bg-white/15
        px-4
        py-3
        backdrop-blur
        ring-1
        ring-white/20
        transition
        duration-200
        hover:bg-white/20
      "
    >
      <div
        className={`
          flex
          items-center
          justify-center
          w-9
          h-9
          rounded-xl
          ${iconBg}
        `}
      >
        <Icon
          size={18}
          className={iconColor}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs opacity-80">
          {label}
        </p>
        <p className="text-xl font-bold">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * Premium demo hero.
 * Reuses operational figures from useDashboardStats
 * with a richer agricultural gradient.
 */
export default function DemoHero({
  currentBirds,
  isolatedBirds,
  availableEggs,
  totalFlocks,
  productionPercentage,
}: Props) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-emerald-600
        via-teal-700
        to-cyan-800
        text-white
        shadow-xl
        ring-1
        ring-emerald-400/40
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -top-10
          -left-10
          w-44
          h-44
          rounded-full
          bg-white/5
          blur-3xl
        "
      />
      <div
        className="
          pointer-events-none
          absolute
          -bottom-8
          -right-8
          w-40
          h-40
          rounded-full
          bg-white/5
          blur-3xl
        "
      />

      <div className="relative p-6 md:p-10">
        <div className="mb-6 flex items-center gap-2">
          <span
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              bg-yellow-300/20
              px-3
              py-1
              text-xs
              font-semibold
              text-yellow-100
              ring-1
              ring-yellow-300/40
            "
          >
            <span
              className="
                inline-block
                h-2
                w-2
                rounded-full
                bg-yellow-300
                animate-pulse
              "
            />
            LIVE DEMO FARM
          </span>
        </div>

        <h1
          className="
            text-3xl
            font-extrabold
            tracking-tight
            md:text-5xl
          "
        >
          PoultryOps Demo Farm
        </h1>

        <p
          className="
            mt-3
            max-w-2xl
            text-lg
            text-emerald-50
          "
        >
          Experience how PoultryOps transforms data
          into real farm profitability - from flock
          health to feed efficiency and beyond.
        </p>

        <div
          className="
            mt-8
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            md:grid-cols-4
          "
        >
          <StatPill
            icon={Bird}
            label="Available Birds"
            value={formatNumber(currentBirds)}
            iconBg="bg-white/20"
            iconColor="text-emerald-200"
          />
          <StatPill
            icon={Layers3}
            label="Active Flocks"
            value={formatNumber(totalFlocks)}
            iconBg="bg-white/20"
            iconColor="text-teal-200"
          />
          <StatPill
            icon={Activity}
            label="Production Rate"
            value={`${formatNumber(productionPercentage)}%`}
            iconBg="bg-white/20"
            iconColor="text-cyan-200"
          />
          <StatPill
            icon={Egg}
            label="Period Eggs"
            value={formatNumber(availableEggs)}
            iconBg="bg-white/20"
            iconColor="text-amber-200"
          />
        </div>

        <div
          className="
            mt-6
            flex
            flex-wrap
            items-center
            gap-4
            text-xs
            text-emerald-100/70
          "
        >
          <span>
            Birds in isolation:{" "}
            <span className="font-medium text-white">
              {formatNumber(isolatedBirds)}
            </span>
          </span>
          <span className="opacity-40">{"\u00A7"}</span>
          <span>
            Farm-wide performance insights
            powered by real operational data
          </span>
        </div>
      </div>
    </div>
  );
}