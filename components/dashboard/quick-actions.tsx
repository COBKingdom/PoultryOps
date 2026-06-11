"use client";

import Link from "next/link";
import {
  Plus,
  Egg,
  Wheat,
  AlertTriangle,
  Receipt,
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Add Flock",
      description: "Create a new flock",
      href: "/flocks",
      icon: Plus,
    },
    {
      title: "Record Eggs",
      description: "Enter egg production",
      href: "/eggs",
      icon: Egg,
    },
    {
      title: "Record Feed",
      description: "Track feed usage",
      href: "/feed",
      icon: Wheat,
    },
    {
      title: "Record Mortality",
      description: "Log bird losses",
      href: "/mortality",
      icon: AlertTriangle,
    },
    {
      title: "Add Expense",
      description: "Record farm expenses",
      href: "/expenses",
      icon: Receipt,
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="
                group
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                hover:border-blue-500
                hover:shadow-lg
                transition-all
                duration-200
              "
            >
              <div className="flex items-start justify-between">

                <div className="
                  w-12
                  h-12
                  rounded-xl
                  bg-slate-100
                  flex
                  items-center
                  justify-center
                  group-hover:bg-blue-50
                  transition
                ">
                  <Icon
                    size={22}
                    className="
                      text-slate-700
                      group-hover:text-blue-600
                    "
                  />
                </div>

              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {action.description}
              </p>

              <div className="
                mt-4
                text-sm
                font-medium
                text-blue-600
              ">
                Open →
              </div>
            </Link>
          );
        })}

      </div>

    </div>
  );
}