"use client";

type Props = {
  totalFeedConsumedKg: number;
  averageDailyFeedKg: number;
  currentFlockCount: number;
  selectedFlockBirds?: number;
};

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const accents = {
  slate: {
    dot: "bg-slate-400",
    ring: "ring-slate-100",
  },
  blue: {
    dot: "bg-blue-600",
    ring: "ring-blue-100",
  },
  amber: {
    dot: "bg-amber-500",
    ring: "ring-amber-100",
  },
  green: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
};

type Accent = keyof typeof accents;

type KpiCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: Accent;
};

function KpiCard({
  label,
  value,
  detail,
  accent,
}: KpiCardProps) {
  const currentAccent = accents[accent];

  return (
    <div
      className="
        relative overflow-hidden rounded-xl border border-blue-100
        bg-white p-5
        shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-blue-200
        hover:shadow-[5px_7px_0_rgba(37,99,235,0.13),0_12px_28px_rgba(15,23,42,0.10)]
      "
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">
            {label}
          </div>

          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {detail}
          </div>
        </div>

        <div
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${currentAccent.dot} ${currentAccent.ring}`}
        />
      </div>
    </div>
  );
}

export default function FeedIntelligenceKpis({
  totalFeedConsumedKg,
  averageDailyFeedKg,
  currentFlockCount,
  selectedFlockBirds,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Feed Consumed"
        value={`${formatNumber(totalFeedConsumedKg)} kg`}
        detail="Actual feed recorded"
        accent="blue"
      />

      <KpiCard
        label="Average Daily"
        value={`${formatNumber(averageDailyFeedKg)} kg`}
        detail="Average consumption"
        accent="amber"
      />

      <KpiCard
        label="Flocks Analysed"
        value={formatNumber(currentFlockCount)}
        detail="Active flocks"
        accent="green"
      />

      <KpiCard
        label="Selected Flock Birds"
        value={
          selectedFlockBirds !== undefined
            ? formatNumber(selectedFlockBirds)
            : "—"
        }
        detail="Starting flock quantity"
        accent="slate"
      />
    </div>
  );
}