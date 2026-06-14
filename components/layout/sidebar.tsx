"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Bird,
  Egg,
  Wheat,
  Package,
  AlertTriangle,
  HeartPulse,
  Receipt,
  ShoppingCart,
  FileBarChart,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname =
    usePathname();

  const operations = [
    {
      name: "Flocks",
      href: "/flocks",
      icon: Bird,
    },
    {
      name: "Egg Production",
      href: "/eggs",
      icon: Egg,
    },
    {
      name: "Feed",
      href: "/feed",
      icon: Wheat,
    },
    {
      name: "Feed Inventory",
      href: "/feed-inventory",
      icon: Package,
    },
    {
      name: "Mortality",
      href: "/mortality",
      icon: AlertTriangle,
    },
    {
      name: "Health",
      href: "/health",
      icon: HeartPulse,
    },
  ];

  const finance = [
    {
      name: "Expenses",
      href: "/expenses",
      icon: Receipt,
    },
    {
      name: "Sales",
      href: "/sales",
      icon: ShoppingCart,
    },
  ];

  const insights = [
    {
      name: "Reports",
      href: "/reports",
      icon: FileBarChart,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen flex flex-col border-r border-slate-800">

      <div className="p-6 border-b border-slate-800">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
            P
          </div>

          <div>
            <h1 className="text-xl font-bold">
              PoultryOps
            </h1>

            <p className="text-xs text-slate-400">
              Poultry Farm Management
            </p>
          </div>

        </div>

      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">

        <MenuItem
          pathname={pathname}
          name="Dashboard"
          href="/dashboard"
          icon={LayoutDashboard}
        />

        <MenuSection
          title="OPERATIONS"
          items={operations}
          pathname={pathname}
        />

        <MenuSection
          title="FINANCE"
          items={finance}
          pathname={pathname}
        />

        <MenuSection
          title="INSIGHTS"
          items={insights}
          pathname={pathname}
        />

        <MenuItem
          pathname={pathname}
          name="Settings"
          href="/settings"
          icon={Settings}
        />

      </nav>

      <div className="p-4 border-t border-slate-800">

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">

          <p className="text-xs text-slate-400">
            PoultryOps SaaS
          </p>

          <p className="text-sm font-semibold mt-1">
            Trial Version
          </p>

          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-blue-500 w-2/3" />
          </div>

        </div>

      </div>

    </aside>
  );
}

function MenuSection({
  title,
  items,
  pathname,
}: any) {
  return (
    <div>

      <p className="px-3 mb-2 text-xs font-semibold text-slate-500 tracking-wider">
        {title}
      </p>

      <div className="space-y-1">

        {items.map(
          (item: any) => (
            <MenuItem
              key={item.href}
              pathname={pathname}
              {...item}
            />
          )
        )}

      </div>

    </div>
  );
}

function MenuItem({
  pathname,
  href,
  name,
  icon: Icon,
}: any) {
  const active =
    pathname === href;

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3
        rounded-xl
        px-4 py-3
        transition-all
        ${
          active
            ? "bg-blue-600 text-white shadow-lg"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }
      `}
    >
      <Icon size={18} />

      <span>{name}</span>

    </Link>
  );
}