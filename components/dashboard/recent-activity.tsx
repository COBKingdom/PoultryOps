"use client";

import Link from "next/link";

import {
  Egg,
  Wheat,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const operations = [
  {
    title: "Egg Production",
    description: "Daily collection and production",
    href: "/eggs",
    icon: Egg,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Feed Management",
    description: "Consumption and feed stock",
    href: "/feed",
    icon: Wheat,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Expenses",
    description: "Operational spending",
    href: "/expenses",
    icon: Receipt,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    title: "Sales",
    description: "Revenue and transactions",
    href: "/sales",
    icon: ShoppingCart,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Mortality",
    description: "Bird losses and trends",
    href: "/mortality",
    icon: AlertTriangle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "Feed Intelligence",
    description: "Feed performance and insights",
    href: "/feed-intelligence",
    icon: Sparkles,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export default function RecentActivity() {
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
          Farm Operations
        </h2>

        <p
          className="
            mt-0.5
            text-xs
            text-slate-500
          "
        >
          Manage your core farm activities
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-2
          sm:grid-cols-2
          sm:gap-3
          lg:grid-cols-3
        "
      >
        {operations.map((operation) => {
          const Icon = operation.icon;

          return (
            <Link
              key={operation.href}
              href={operation.href}
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3.5
                shadow-sm
                transition-all
                duration-200
                hover:border-blue-200
                hover:bg-slate-50
                hover:shadow-md
                active:scale-[0.99]
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
                  rounded-xl
                  ${operation.iconBg}
                `}
              >
                <Icon
                  size={18}
                  className={operation.iconColor}
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
                  {operation.title}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[11px]
                    text-slate-500
                  "
                >
                  {operation.description}
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