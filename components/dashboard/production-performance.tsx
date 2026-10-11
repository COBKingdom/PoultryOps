
import {
  Activity,
  Egg,
  TrendingUp,
} from "lucide-react";

type Props = {
  todayEggs: number;
  availableEggs: number;
  productionPercentage: number;
};

function ProductionGauge({
  percentage,
}: {
  percentage: number;
}) {
  const radius = 38;
  const circumference = Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <div className="flex h-[76px] w-[118px] shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 100 58"
        className="h-[76px] w-[118px]"
        role="img"
        aria-label={`Production rate ${percentage.toFixed(2)} percent`}
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
          stroke="#10b981"
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
          {percentage.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}

export default function ProductionPerformance({
  todayEggs,
  availableEggs,
  productionPercentage,
}: Props) {
  const percentage = Math.max(
    0,
    Math.min(100, Number(productionPercentage) || 0)
  );

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        border-t-[3px]
        border-t-blue-500
        bg-white
        shadow-[4px_5px_0_rgba(37,99,235,0.08),0_8px_22px_rgba(15,23,42,0.05)]
      "
    >
      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          px-4
          py-3.5
        "
      >
        <div>
          <h2
            className="
              text-sm
              font-semibold
              tracking-tight
              text-slate-900
            "
          >
            Production Performance
          </h2>

          <p
            className="
              mt-0.5
              text-[10px]
              text-slate-500
            "
          >
            Production efficiency for the selected period
          </p>
        </div>

        <div
          className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            bg-cyan-50
          "
        >
          <Activity
            size={14}
            className="text-cyan-600"
          />
        </div>
      </div>

      <div className="p-4">
        {/* Production rate and gauge */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Production Rate
            </p>

            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp
                size={16}
                className="text-emerald-600"
              />

              <span className="text-sm font-semibold text-emerald-700">
                Current
              </span>
            </div>
          </div>

          <ProductionGauge percentage={percentage} />
        </div>

        {/* Supporting metrics */}

        <div
          className="
            mt-3
            grid
            grid-cols-2
            gap-2
          "
        >
          <div
            className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              px-3
              py-2.5
            "
          >
            <div className="flex items-center gap-2">
              <Egg
                size={15}
                className="text-amber-600"
              />

              <span
                className="
                  text-[10px]
                  font-medium
                  text-slate-500
                "
              >
                Eggs Today
              </span>
            </div>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-slate-900
              "
            >
              {Number(todayEggs).toLocaleString()}
            </p>
          </div>

          <div
            className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              px-3
              py-2.5
            "
          >
            <div className="flex items-center gap-2">
              <Egg
                size={15}
                className="text-amber-600"
              />

              <span
                className="
                  text-[10px]
                  font-medium
                  text-slate-500
                "
              >
                Eggs Available
              </span>
            </div>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-slate-900
              "
            >
              {Number(availableEggs).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
