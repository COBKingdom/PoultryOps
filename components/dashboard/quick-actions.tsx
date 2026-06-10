"use client";

import Link from "next/link";

export default function QuickActions() {
  const actions = [
    {
      title: "Add Flock",
      description:
        "Create a new flock",
      href: "/flocks",
    },
    {
      title: "Record Eggs",
      description:
        "Enter egg production",
      href: "/eggs",
    },
    {
      title: "Record Feed",
      description:
        "Track feed usage",
      href: "/feed",
    },
    {
      title: "Record Mortality",
      description:
        "Log bird losses",
      href: "/mortality",
    },
    {
      title: "Add Expense",
      description:
        "Record farm expenses",
      href: "/expenses",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold">
          Quick Actions
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Frequently used farm operations
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">

        {actions.map(
          (action) => (
            <Link
              key={
                action.href
              }
              href={
                action.href
              }
              className="group rounded-xl border border-slate-200 p-5 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-lg font-semibold text-slate-900">
                {action.title}
              </div>

              <div className="text-sm text-slate-500 mt-2">
                {
                  action.description
                }
              </div>

              <div className="mt-4 text-sm text-blue-600 font-medium">
                Open →
              </div>
            </Link>
          )
        )}

      </div>

    </div>
  );
}