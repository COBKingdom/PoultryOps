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
      title: "Sales",
      href: "/sales",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Frequently used farm operations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="
                rounded-2xl
                border
                border-slate-200
                p-6
                flex
                flex-col
                items-center
                justify-center
                gap-3
                hover:border-blue-500
                hover:shadow-md
                transition-all
              "
            >
              <Icon
                size={34}
                className="text-blue-600"
              />

              <span className="font-semibold text-slate-900 text-center">
                {action.title}
              </span>
            </Link>
          );
        })}

      </div>

    </div>
  );
}