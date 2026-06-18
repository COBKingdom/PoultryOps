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
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Add Flock",
      subtitle: "Create new flock",
      href: "/flocks",
      icon: Plus,
    },
    {
      title: "Record Eggs",
      subtitle: "Daily egg production",
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
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Access your most common farm operations
        </p>

      </div>

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >

        {actions.map((action) => {
          const Icon =
            action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                hover:border-blue-500
                hover:shadow-lg
                transition-all
                group
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-blue-50
                  flex
                  items-center
                  justify-center
                  mb-4
                  group-hover:bg-blue-100
                "
              >
                <Icon
                  size={24}
                  className="text-blue-600"
                />
              </div>

              <h3
                className="
                  font-semibold
                  text-slate-900
                "
              >
                {action.title}
              </h3>

              <p
                className="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                {action.subtitle}
              </p>

            </Link>
          );
        })}

      </div>

    </div>
  );
}