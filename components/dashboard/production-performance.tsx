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
        bg-white
        shadow-sm
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
            Production for the selected period
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

        {/* Main production figure */}

        <div
          className="
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div>
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

            <div className="mt-1 flex items-baseline gap-1.5">
              <p
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                "
              >
                {percentage.toFixed(2)}
              </p>

              <span
                className="
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                %
              </span>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              rounded-full
              bg-emerald-50
              px-2.5
              py-1
              text-[10px]
              font-semibold
              text-emerald-700
            "
          >
            <TrendingUp size={13} />
            Current
          </div>
        </div>

        {/* Production indicator */}

        <div className="mt-4">
          <div
            className="
              h-2
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                transition-all
                duration-500
              "
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>

        {/* Supporting metrics */}

        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-2
          "
        >
          <div
            className="
              rounded-xl
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