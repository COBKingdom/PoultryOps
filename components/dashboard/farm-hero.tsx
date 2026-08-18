import {
  Bird,
  Egg,
  HeartPulse,
  Layers3,
} from "lucide-react";

type Props = {
  currentBirds: number;
  isolatedBirds: number;
  availableEggs: number;
  totalFlocks: number;
};

export default function FarmHero({
  currentBirds,
  isolatedBirds,
  availableEggs,
  totalFlocks,
}: Props) {
  const formatNumber = (value: number) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  return (
    <div
      className="
        rounded-3xl
        bg-gradient-to-br
        from-blue-600
        via-blue-700
        to-slate-900
        text-white
        overflow-hidden
        shadow-xl
      "
    >
      <div className="p-6 md:p-8">

        <p
          className="
            text-blue-100
            text-xs
            uppercase
            tracking-[0.2em]
            font-semibold
          "
        >
          PoultryOps
        </p>

        <h2
          className="
            mt-3
            text-3xl
            md:text-5xl
            font-bold
            leading-tight
          "
        >
          Dashboard Overview
        </h2>

        <p
          className="
            mt-2
            text-blue-100
            text-sm
            md:text-base
          "
        >
          Real-time farm performance overview
        </p>

        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-4
          "
        >

          {/* Available Birds */}
          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <Bird size={18} />

              <span className="text-sm">
                Available Birds
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {formatNumber(currentBirds)}
            </div>
          </div>

          {/* Birds in Isolation */}
          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <HeartPulse size={18} />

              <span className="text-sm">
                Birds in Isolation
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {formatNumber(isolatedBirds)}
            </div>
          </div>

          {/* Available Eggs */}
          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <Egg size={18} />

              <span className="text-sm">
                Available Eggs
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {formatNumber(availableEggs)}
            </div>
          </div>

          {/* Flocks */}
          <div
            className="
              rounded-2xl
              bg-white/10
              backdrop-blur
              p-4
            "
          >
            <div className="flex items-center gap-2">

              <Layers3 size={18} />

              <span className="text-sm">
                Flocks
              </span>

            </div>

            <div
              className="
                mt-3
                text-3xl
                font-bold
              "
            >
              {formatNumber(totalFlocks)}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}