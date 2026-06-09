"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-8">
        PoultryOps
      </h2>

      <nav className="space-y-4">

        <Link
          href="/dashboard"
          className="block hover:text-blue-300"
        >
          Dashboard
        </Link>

        <Link
          href="/flocks"
          className="block hover:text-blue-300"
        >
          Flocks
        </Link>

        <Link
          href="/eggs"
          className="block hover:text-blue-300"
        >
          Egg Production
        </Link>

        <Link
          href="/feed"
          className="block hover:text-blue-300"
        >
          Feed
        </Link>

        <Link
          href="/mortality"
          className="block hover:text-blue-300"
        >
          Mortality
        </Link>

        <Link
          href="/expenses"
          className="block hover:text-blue-300"
        >
          Expenses
        </Link>

        <Link
          href="/sales"
          className="block hover:text-blue-300"
        >
          Sales
        </Link>

        <Link
          href="/reports"
          className="block hover:text-blue-300"
        >
          Reports
        </Link>

        <Link
          href="/settings"
          className="block hover:text-blue-300"
        >
          Settings
        </Link>

      </nav>
    </aside>
  );
}