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

  const metrics = [
    { label: "Available Birds", value: currentBirds, icon: Bird },
    { label: "Birds in Isolation", value: isolatedBirds, icon: HeartPulse },
    { label: "Available Eggs", value: availableEggs, icon: Egg },
    { label: "Flocks", value: totalFlocks, icon: Layers3 },
  ];

  return (
    <section
      className="
        relative overflow-hidden rounded-3xl border border-[#16498f]
        bg-gradient-to-br from-[#0b2f6b] via-[#10489a] to-[#0a2b61]
        text-white
        shadow-[0_18px_45px_rgba(6,31,73,0.14)]
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-24 -top-28 h-72 w-72
          rounded-full bg-white/10 blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64
          rounded-full bg-blue-300/10 blur-3xl
        "
      />

      <div className="relative p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className="
                text-[11px] font-semibold uppercase tracking-[0.2em]
                text-blue-100
              "
            >
              PoultryOps
            </p>

            <h2
              className="
                mt-2 text-2xl font-bold tracking-tight
                sm:text-3xl lg:text-4xl
              "
            >
              Dashboard Overview
            </h2>

            <p className="mt-2 text-sm text-blue-50 sm:text-[15px]">
              Real-time farm performance overview
            </p>
          </div>

          <div
            className="
              hidden rounded-full border border-white/15 bg-white/10
              px-3 py-1.5 text-[10px] font-semibold uppercase
              tracking-[0.16em] text-blue-50 sm:block
            "
          >
            Farm Overview
          </div>
        </div>

        <div
          className="
            mt-7 grid grid-cols-1 gap-3
            sm:grid-cols-2 lg:grid-cols-4
          "
        >
          {metrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="
                rounded-2xl border border-white/15 bg-white/[0.10]
                p-4 backdrop-blur-sm transition duration-200
                hover:bg-white/[0.14]
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-xl border border-white/15 bg-white/[0.12]
                    text-white
                  "
                >
                  <Icon size={18} strokeWidth={2} />
                </div>

                <span className="text-sm font-medium text-blue-50">
                  {label}
                </span>
              </div>

              <div
                className="
                  mt-4 text-3xl font-bold tracking-tight
                  sm:text-[32px]
                "
              >
                {formatNumber(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
