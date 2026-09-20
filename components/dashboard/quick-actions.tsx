"use client";

import Link from "next/link";

import {
  Plus,
  Egg,
  Wheat,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  HeartPulse,
  Package,
  BarChart3,
} from "lucide-react";

const actions = [
  {
    title: "Add Flock",
    subtitle: "Create new flock",
    href: "/flocks",
    icon: Plus,
  },
  {
    title: "Record Eggs",
    subtitle: "Daily production",
    href: "/eggs",
    icon: Egg,
  },
  {
    title: "Record Feed",
    subtitle: "Feed consumption",
    href: "/feed",
    icon: Wheat,
  },
  {
    title: "Feed Stock",
    subtitle: "Manage inventory",
    href: "/feed-inventory",
    icon: Package,
  },
  {
    title: "Mortality",
    subtitle: "Record bird losses",
    href: "/mortality",
    icon: AlertTriangle,
  },
  {
    title: "Health",
    subtitle: "Vaccines & treatment",
    href: "/health",
    icon: HeartPulse,
  },
  {
    title: "Expense",
    subtitle: "Record spending",
    href: "/expenses",
    icon: Receipt,
  },
  {
    title: "Sales",
    subtitle: "Record income",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "Reports",
    subtitle: "View farm reports",
    href: "/reports",
    icon: BarChart3,
  },
];

export default function QuickActions() {
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
          Quick Actions
        </h2>

        <p
          className="
            mt-0.5
            text-xs
            text-slate-500
          "
        >
          Common farm operations
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-2
          sm:gap-3
          lg:grid-cols-3
        "
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-3
                py-3
                shadow-sm
                transition-all
                duration-200
                hover:border-blue-300
                hover:bg-slate-50
                hover:shadow-md
                active:scale-[0.98]
                sm:px-4
                sm:py-3.5
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  transition-colors
                  group-hover:bg-blue-100
                "
              >
                <Icon
                  size={18}
                  className="text-blue-600"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  {action.title}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[11px]
                    text-slate-500
                  "
                >
                  {action.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}