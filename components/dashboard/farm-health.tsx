
import {
  Activity,
  Bird,
  CheckCircle2,
  HeartPulse,
  Wheat,
} from "lucide-react";

type Props = {
  currentBirds: number;
  productionPercentage: number;
};

type HealthItemProps = {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  iconBg: string;
  iconColor: string;
};

function HealthItem({
  label,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
}: HealthItemProps) {
  return (
    <div
      className="
        flex min-h-0 items-center gap-3
        rounded-xl border border-slate-200
        bg-slate-50/70 px-3 py-3
      "
    >
      <div
        className={`
          flex h-8 w-8 shrink-0 items-center
          justify-center rounded-lg ${iconBg}
        `}
      >
        <Icon size={16} className={iconColor} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {label}
          </p>
          <p className="shrink-0 text-sm font-bold text-slate-900">
            {value}
          </p>
        </div>

        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProductionGauge({
  productionPercentage,
}: {
  productionPercentage: number;
}) {
  const rawPercentage = Number(productionPercentage) || 0;
  const percentage = Math.max(0, Math.min(100, rawPercentage));

  const radius = 38;
  const circumference = Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <div className="flex min-h-0 items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-[0_3px_10px_rgba(37,99,235,0.06)]">
      <div className="flex h-[58px] w-[90px] shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 100 58"
          className="h-[58px] w-[90px]"
          role="img"
          aria-label={`Production rate ${rawPercentage.toFixed(2)} percent`}
        >
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="#2563eb"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-500"
          />
          <text
            x="50"
            y="43"
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill="currentColor"
          >
            {rawPercentage.toFixed(1)}%
          </text>
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="shrink-0 text-blue-600" />
          <p className="text-sm font-semibold text-slate-900">
            Production
          </p>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Production performance for the selected period
        </p>
      </div>
    </div>
  );
}

export default function FarmHealth({
  currentBirds,
  productionPercentage,
}: Props) {
  return (
    <section
      className="
        flex h-full flex-col overflow-hidden
        rounded-2xl border border-slate-200
        bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)]
      "
    >
      <div
        className="
          flex shrink-0 items-center justify-between
          border-b border-slate-100 px-4 py-3.5
        "
      >
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Farm Health
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Current operational health indicators
          </p>
        </div>

        <div
          className="
            flex items-center gap-1.5 rounded-full
            bg-emerald-50 px-2.5 py-1
            text-[10px] font-semibold text-emerald-700
          "
        >
          <CheckCircle2 size={13} />
          Operational
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        <HealthItem
          label="Available Birds"
          value={Number(currentBirds).toLocaleString()}
          description="Birds currently available on the farm"
          icon={Bird}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <ProductionGauge
          productionPercentage={productionPercentage}
        />

        <HealthItem
          label="Health Status"
          value="Normal"
          description="Current farm health status"
          icon={HeartPulse}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <HealthItem
          label="Feed Status"
          value="Available"
          description="Current feed availability status"
          icon={Wheat}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>
    </section>
  );
}
