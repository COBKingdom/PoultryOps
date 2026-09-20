import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  HeartPulse,
} from "lucide-react";

const items = [
  {
    title: "Birds in Isolation",
    description: "Birds currently isolated",
    href: "/isolation",
    icon: HeartPulse,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    title: "Mortality",
    description: "Recorded bird mortality",
    href: "/mortality",
    icon: AlertTriangle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];

export default function AttentionNeeded({
  isolatedBirds,
  totalMortality,
}: {
  isolatedBirds: number;
  totalMortality: number;
}) {
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
        <div className="flex items-center gap-2.5">
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-red-50
            "
          >
            <AlertTriangle
              size={16}
              className="text-red-600"
            />
          </div>

          <div>
            <h2
              className="
                text-sm
                font-semibold
                tracking-tight
                text-slate-900
              "
            >
              Attention Needed
            </h2>

            <p
              className="
                mt-0.5
                text-[10px]
                text-slate-500
              "
            >
              Areas requiring review
            </p>
          </div>
        </div>

        <Link
          href="/reports"
          className="
            text-[10px]
            font-semibold
            text-blue-600
            hover:text-blue-700
          "
        >
          View All
        </Link>
      </div>

      {/* Attention items */}

      <div
        className="
          flex
          flex-1
          flex-col
          gap-2
          p-3
        "
      >
        {items.map((item) => {
          const Icon = item.icon;

          const value =
            item.href === "/isolation"
              ? `${Number(isolatedBirds).toLocaleString()} birds currently isolated`
              : `${Number(totalMortality).toLocaleString()} recorded mortality`;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="
                group
                flex
                min-h-0
                flex-1
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                py-3
                transition-colors
                hover:bg-slate-50
              "
            >
              <div
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${item.iconBg}
                `}
              >
                <Icon
                  size={17}
                  className={item.iconColor}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  {item.title}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    text-slate-500
                  "
                >
                  {value}
                </p>
              </div>

              <ArrowRight
                size={15}
                className="
                  shrink-0
                  text-slate-300
                  transition-all
                  group-hover:translate-x-0.5
                  group-hover:text-blue-500
                "
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}