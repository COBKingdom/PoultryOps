import {
  Bird,
  Egg,
  Layers3,
  TrendingUp,
} from "lucide-react";

type Props = {
  currentBirds: number;
  isolatedBirds: number;
  availableEggs: number;
  totalFlocks: number;
};

type HeroMetricProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  iconBg: string;
  iconColor: string;
};

function HeroMetric({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: HeroMetricProps) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-3
        rounded-2xl
        border
        border-white/20
        bg-white
        px-3
        py-3
        shadow-sm
        sm:px-4
        sm:py-3.5
      "
    >
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${iconBg}
        `}
      >
        <Icon
          size={20}
          className={iconColor}
        />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-wide
            text-slate-500
            sm:text-[11px]
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-xl
            font-bold
            tracking-tight
            text-slate-900
            sm:text-2xl
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function FarmHero({
  currentBirds,
  isolatedBirds,
  availableEggs,
  totalFlocks,
}: Props) {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-blue-950
        via-blue-900
        to-blue-700
        shadow-lg
      "
    >
      {/* Decorative background shapes */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-blue-400/20
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          left-1/3
          h-72
          w-72
          rounded-full
          bg-cyan-400/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          p-5
          sm:p-6
          lg:p-7
        "
      >
        {/* Hero heading */}

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-blue-200
              "
            >
              PoultryOps
            </p>

            <h1
              className="
                mt-1
                text-2xl
                font-bold
                tracking-tight
                text-white
                sm:text-3xl
              "
            >
              Farm Performance Today
            </h1>

            <p
              className="
                mt-1
                max-w-xl
                text-sm
                text-blue-100
                sm:text-base
              "
            >
              A clear view of your farm's current
              operational position.
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-emerald-300/30
              bg-emerald-400/15
              px-3
              py-1.5
              text-xs
              font-semibold
              text-emerald-100
            "
          >
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
              "
            />

            Farm Overview
          </div>
        </div>

        {/* Metrics */}

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-2.5
            lg:grid-cols-4
            lg:gap-3
          "
        >
          <HeroMetric
            label="Available Birds"
            value={Number(currentBirds).toLocaleString()}
            icon={Bird}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />

          <HeroMetric
            label="Total Flocks"
            value={Number(totalFlocks).toLocaleString()}
            icon={Layers3}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />

          <HeroMetric
            label="Eggs Available"
            value={Number(availableEggs).toLocaleString()}
            icon={Egg}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />

          <HeroMetric
            label="Birds in Isolation"
            value={Number(isolatedBirds).toLocaleString()}
            icon={TrendingUp}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>
      </div>
    </section>
  );
}