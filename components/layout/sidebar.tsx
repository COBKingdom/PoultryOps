"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname =
    usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Flocks",
      href: "/flocks",
    },
    {
      name: "Egg Production",
      href: "/eggs",
    },
    {
      name: "Feed",
      href: "/feed",
    },
    {
      name: "Mortality",
      href: "/mortality",
    },
    {
      name: "Expenses",
      href: "/expenses",
    },
    {
      name: "Sales",
      href: "/sales",
    },
    {
      name: "Reports",
      href: "/reports",
    },
    {
      name: "Settings",
      href: "/settings",
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen flex flex-col border-r border-slate-800">

      <div className="p-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold">
          PoultryOps
        </h1>

        <p className="text-xs text-slate-400 mt-1">
          Poultry Farm Management
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">

        {links.map(
          (link) => {
            const active =
              pathname ===
              link.href;

            return (
              <Link
                key={
                  link.href
                }
                href={
                  link.href
                }
                className={`block rounded-xl px-4 py-3 transition-all ${
                  active
                    ? "bg-blue-600 text-white font-semibold shadow"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          }
        )}

      </nav>

      <div className="p-4 border-t border-slate-800">

        <div className="rounded-xl bg-slate-900 p-3">

          <p className="text-xs text-slate-400">
            PoultryOps SaaS
          </p>

          <p className="text-sm font-medium mt-1">
            Trial Version
          </p>

        </div>

      </div>

    </aside>
  );
}