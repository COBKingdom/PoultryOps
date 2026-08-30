"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { usePermissions } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";
import { PERMISSIONS } from "@/lib/permissions";

import {
  LayoutDashboard,
  Bird,
  Egg,
  Wheat,
  Package,
  AlertTriangle,
  HeartPulse,
  Activity,
  Receipt,
  ShoppingCart,
  BarChart3,
  ChartColumn,
  Brain,
  Settings,
  User,
  LogOut,
  Upload,
  Users,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    can,
    isPlatformAdmin,
  } = usePermissions();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const operations = [
    {
      name: "Flocks",
      href: "/flocks",
      icon: Bird,
      permission:
        PERMISSIONS.FLOCKS_VIEW,
    },
    {
      name: "Egg Production",
      href: "/eggs",
      icon: Egg,
      permission:
        PERMISSIONS.EGGS_VIEW,
    },
    {
      name: "Feed",
      href: "/feed",
      icon: Wheat,
      permission:
        PERMISSIONS.FEED_VIEW,
    },
    {
      name: "Feed Inventory",
      href: "/feed-inventory",
      icon: Package,
      permission:
        PERMISSIONS.FEED_INVENTORY_VIEW,
    },
    {
      name: "Mortality",
      href: "/mortality",
      icon: AlertTriangle,
      permission:
        PERMISSIONS.MORTALITY_VIEW,
    },
    {
      name: "Isolation",
      href: "/isolation",
      icon: Activity,
      permission:
        PERMISSIONS.ISOLATION_VIEW,
    },
    {
      name: "Health",
      href: "/health",
      icon: HeartPulse,
      permission:
        PERMISSIONS.HEALTH_VIEW,
    },
  ];

  const finance = [
    {
      name: "Expenses",
      href: "/expenses",
      icon: Receipt,
      permission:
        PERMISSIONS.EXPENSES_VIEW,
    },
    {
      name: "Sales",
      href: "/sales",
      icon: ShoppingCart,
      permission:
        PERMISSIONS.SALES_VIEW,
    },
  ];

  const insights = [
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      permission:
        PERMISSIONS.REPORTS_VIEW,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartColumn,
      permission:
        PERMISSIONS.ANALYTICS_VIEW,
    },
    {
      name: "Feed Intelligence",
      href: "/feed-intelligence",
      icon: Brain,
      permission:
        PERMISSIONS.ANALYTICS_VIEW,
    },
  ];

  const tools = [
    {
      name: "Migration",
      href: "/migration",
      icon: Upload,
      permission:
        PERMISSIONS.MIGRATION_VIEW,
    },
  ];

  const team = [
    {
      name: "Team",
      href: "/team",
      icon: Users,
      permission:
        PERMISSIONS.TEAM_VIEW,
    },
  ];

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 text-white">

      {/* Brand */}
      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
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

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">

        {can(
          PERMISSIONS.DASHBOARD_VIEW
        ) && (
          <MenuItem
            pathname={pathname}
            name="Dashboard"
            href="/dashboard"
            icon={LayoutDashboard}
          />
        )}

        <MenuSection
          title="OPERATIONS"
          items={operations.filter(
            (item) =>
              can(item.permission)
          )}
          pathname={pathname}
        />

        <MenuSection
          title="FINANCE"
          items={finance.filter(
            (item) =>
              can(item.permission)
          )}
          pathname={pathname}
        />

        <MenuSection
          title="INSIGHTS"
          items={insights.filter(
            (item) =>
              can(item.permission)
          )}
          pathname={pathname}
        />

        <MenuSection
          title="TOOLS"
          items={tools.filter(
            (item) =>
              can(item.permission)
          )}
          pathname={pathname}
        />

        <MenuSection
          title="TEAM"
          items={team.filter(
            (item) =>
              can(item.permission)
          )}
          pathname={pathname}
        />

        {/* Platform Administration */}
        {isPlatformAdmin && (
          <MenuSection
            title="ADMINISTRATION"
            items={[
              {
                name: "Admin Control Centre",
                href: "/admin",
                icon: ShieldCheck,
              },
              {
                name: "POGP",
                href: "/admin/pogp",
                icon: Users,
              },
            ]}
            pathname={pathname}
          />
        )}

      </nav>

      {/* Bottom Navigation */}
      <div className="space-y-1 border-t border-slate-800 p-4">

        <MenuItem
          pathname={pathname}
          name="Profile"
          href="/profile"
          icon={User}
        />

        {can(
          PERMISSIONS.SETTINGS_VIEW
        ) && (
          <MenuItem
            pathname={pathname}
            name="Settings"
            href="/settings"
            icon={Settings}
          />
        )}

        <button
          onClick={handleSignOut}
          className="
            flex w-full items-center gap-3 rounded-xl px-4 py-3
            text-red-400 transition-all hover:bg-red-950
          "
        >
          <LogOut size={18} />

          <span>
            Sign Out
          </span>
        </button>

        <div className="border-t border-slate-800 pt-4">

          <p className="text-xs text-slate-500">
            PoultryOps
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Version 1.0.1
          </p>

        </div>

      </div>

    </aside>
  );
}

function MenuSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{
      size: number;
    }>;
    permission?: string;
  }>;
  pathname: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>

      <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500">
        {title}
      </p>

      <div className="space-y-1">

        {items.map(
          (item) => (
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
}: {
  pathname: string;
  href: string;
  name: string;
  icon: React.ComponentType<{
    size: number;
  }>;
}) {
  const active =
    pathname === href ||
    (href !== "/" &&
      pathname.startsWith(
        href + "/"
      ));

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 rounded-xl px-4 py-3
        transition-all
        ${
          active
            ? "bg-blue-600 text-white shadow-lg"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }
      `}
    >
      <Icon size={18} />

      <span>
        {name}
      </span>
    </Link>
  );
}