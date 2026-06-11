"use client";

import Link from "next/link";

import {
  Plus,
  Egg,
  Wheat,
  AlertTriangle,
  Receipt,
  ShoppingCart,
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Add Flock",
      href: "/flocks",
      icon: Plus,
    },
    {
      title: "Record Eggs",
      href: "/eggs",
      icon: Egg,
    },
    {
      title: "Record Feed",
      href: "/feed",
      icon: Wheat,
    },
    {
      title: "Mortality",
      href: "/mortality",
      icon: AlertTriangle,
    },
    {
      title: "Expense",
      href: "/expenses",
      icon: Receipt,
    },
    {
      title: "Record Sale",
      href: "/sales",
      icon: ShoppingCart,
    },
  ];

  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-slate-200
        p-5
        shadow-sm
      "
    >
      <div className="mb-4">

        <h2
          className="
            text-lg
            font-bold
            text-slate-900
          "
        >
          Quick Actions
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-5
          gap-3
        "
      >

        {actions.map(
          (action) => {
            const Icon =
              action.icon;

            return (
              <Link
                key={
                  action.href
                }
                href={
                  action.href
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  p-4
                  hover:border-blue-500
                  hover:bg-blue-50
                  transition-all
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    text-center
                    gap-2
                  "
                >
                  <Icon
                    size={22}
                    className="
                      text-blue-600
                    "
                  />

                  <span
                    className="
                      text-sm
                      font-medium
                      text-slate-900
                    "
                  >
                    {action.title}
                  </span>

                </div>
              </Link>
            );
          }
        )}

      </div>

    </div>
  );
}