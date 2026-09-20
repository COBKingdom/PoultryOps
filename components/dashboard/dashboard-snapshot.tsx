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

type SnapshotCardProps = {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  description: string;
};

function SnapshotCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  description,
}: SnapshotCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        px-4
        py-4
        shadow-sm
        transition-shadow
        duration-200
        hover:shadow-md
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              text-2xl
              font-bold
              tracking-tight
              text-slate-900
              sm:text-3xl
            "
          >
            {Number(value).toLocaleString()}
          </p>

          <p
            className="
              mt-1
              text-[11px]
              leading-4
              text-slate-500
            "
          >
            {description}
          </p>
        </div>

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
      </div>
    </div>
  );
}

export default function DashboardSnapshot({
  currentBirds,
  isolatedBirds,
  availableEggs,
  totalFlocks,
}: Props) {
  return (
    <section>
      <div className="mb-3">
        <h2
          className="
            text-base
            font-semibold
            tracking-tight
            text-slate-900
          "
        >
          Farm Snapshot
        </h2>

        <p
          className="
            mt-0.5
            text-xs
            text-slate-500
          "
        >
          Current operational position
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-3
          lg:grid-cols-4
          lg:gap-4
        "
      >
        <SnapshotCard
          label="Available Birds"
          value={currentBirds}
          icon={Bird}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          description="Currently on the farm"
        />

        <SnapshotCard
          label="Flocks"
          value={totalFlocks}
          icon={Layers3}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          description="Active farm flocks"
        />

        <SnapshotCard
          label="Available Eggs"
          value={availableEggs}
          icon={Egg}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          description="Current egg availability"
        />

        <SnapshotCard
          label="In Isolation"
          value={isolatedBirds}
          icon={HeartPulse}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          description="Birds currently isolated"
        />
      </div>
    </section>
  );
}