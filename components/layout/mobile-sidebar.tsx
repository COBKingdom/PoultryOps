"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
  X,
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
  Upload,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSidebar({
  open,
  onClose,
}: Props) {
  const pathname =
    usePathname();

  const { profile } =
    useAuth();

  const isOwner =
    profile?.role === "owner";

  if (!open) return null;

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

  const tools = [
    {
      name: "Migration",
      href: "/migration",
      icon: Upload,
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      <aside
        className="
          fixed
          left-0
          top-0
          h-full
          w-72
          bg-slate-950
          text-white
          z-50
          flex
          flex-col
        "
      >
        <div className="p-5 border-b border-slate-800">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-blue-600
                  flex
                  items-center
                  justify-center
                  font-bold
                "
              >
                P
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  PoultryOps
                </h2>

                <p className="text-xs text-slate-400">
                  Poultry Farm Management
                </p>
              </div>

            </div>

            <button
              onClick={onClose}
              className="
                p-2
                rounded-lg
                hover:bg-slate-800
              "
            >
              <X size={20} />
            </button>

          </div>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {isOwner && (
            <MenuItem
              pathname={pathname}
              href="/dashboard"
              name="Dashboard"
              icon={LayoutDashboard}
              onClose={onClose}
            />
          )}

          <MenuSection
            title="OPERATIONS"
            items={operations}
            pathname={pathname}
            onClose={onClose}
          />

          <MenuSection
            title="FINANCE"
            items={finance}
            pathname={pathname}
            onClose={onClose}
          />

          {isOwner && (
            <MenuSection
              title="INSIGHTS"
              items={insights}
              pathname={pathname}
              onClose={onClose}
            />
          )}

          {isOwner && (
            <MenuSection
              title="TOOLS"
              items={tools}
              pathname={pathname}
              onClose={onClose}
            />
          )}

          {isOwner && (
            <MenuItem
              pathname={pathname}
              href="/settings"
              name="Settings"
              icon={Settings}
              onClose={onClose}
            />
          )}

        </div>

        <div className="p-4 border-t border-slate-800">

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-4
            "
          >

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
    </>
  );
}

function MenuSection({
  title,
  items,
  pathname,
  onClose,
}: any) {
  return (
    <div>

      <p
        className="
          text-xs
          text-slate-500
          font-semibold
          tracking-wider
          mb-2
        "
      >
        {title}
      </p>

      <div className="space-y-1">

        {items.map(
          (item: any) => (
            <MenuItem
              key={item.href}
              pathname={pathname}
              onClose={onClose}
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
  onClose,
}: any) {
  const active =
    pathname === href;

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-xl
        transition-all
        ${
          active
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }
      `}
    >
      <Icon size={18} />
      <span>{name}</span>
    </Link>
  );
}