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
        flex
        min-h-0
        items-center
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-slate-50/70
        px-3
        py-3
      "
    >
      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          ${iconBg}
        `}
      >
        <Icon
          size={16}
          className={iconColor}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="
            flex
            items-center
            justify-between
            gap-2
          "
        >
          <p
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {label}
          </p>

          <p
            className="
              shrink-0
              text-sm
              font-bold
              text-slate-900
            "
          >
            {value}
          </p>
        </div>

        <p
          className="
            mt-0.5
            truncate
            text-[10px]
            text-slate-500
          "
        >
          {description}
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
        flex
        h-full
        flex-col
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
          shrink-0
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
            Farm Health
          </h2>

          <p
            className="
              mt-0.5
              text-[10px]
              text-slate-500
            "
          >
            Current operational health indicators
          </p>
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
          <CheckCircle2 size={13} />
          Operational
        </div>
      </div>

      {/* Health indicators */}

      <div
        className="
          grid
          flex-1
          grid-cols-1
          gap-2
          p-3
          sm:grid-cols-2
        "
      >
        <HealthItem
          label="Available Birds"
          value={Number(currentBirds).toLocaleString()}
          description="Birds currently available on the farm"
          icon={Bird}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <HealthItem
          label="Production"
          value={`${Number(productionPercentage).toFixed(2)}%`}
          description="Production performance for the selected period"
          icon={Activity}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
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