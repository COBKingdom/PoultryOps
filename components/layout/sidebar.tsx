"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  Receipt,
  ShoppingCart,
  FileBarChart,
  BarChart3,
  Settings,
  User,
  LogOut,
  Upload,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();
    const { profile } = useAuth();
    const { can, loading } = usePermissions();

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  const operations = [
    {
      name: "Flocks",
      href: "/flocks",
      icon: Bird,
      permission: PERMISSIONS.FLOCKS_VIEW,
    },
    {
      name: "Egg Production",
      href: "/eggs",
      icon: Egg,
      permission: PERMISSIONS.EGG_PRODUCTION_VIEW,
    },
    {
      name: "Feed",
      href: "/feed",
      icon: Wheat,
      permission: PERMISSIONS.FEED_VIEW,
    },
    {
      name: "Feed Inventory",
      href: "/feed-inventory",
      icon: Package,
      permission: PERMISSIONS.FEED_INVENTORY_VIEW,
    },
    {
      name: "Mortality",
      href: "/mortality",
      icon: AlertTriangle,
      permission: PERMISSIONS.MORTALITY_VIEW,
    },
    {
      name: "Health",
      href: "/health",
      icon: HeartPulse,
      permission: PERMISSIONS.HEALTH_VIEW,
    },
  ];

  const finance = [
    {
      name: "Expenses",
      href: "/expenses",
      icon: Receipt,
      permission: PERMISSIONS.EXPENSES_VIEW,
    },
    {
      name: "Sales",
      href: "/sales",
      icon: ShoppingCart,
      permission: PERMISSIONS.SALES_VIEW,
    },
  ];

const insights = [
  {
    name: "Reports",
    href: "/reports",
    icon: FileBarChart,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
];

const tools = [
  {
    name: "Migration",
    href: "/migration",
    icon: Upload,
    permission: PERMISSIONS.MIGRATION_VIEW,
  },
];

const team = [
  {
    name: "Team",
    href: "/team",
    icon: Users,
    permission: PERMISSIONS.TEAM_VIEW,
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

         {can(PERMISSIONS.DASHBOARD_VIEW) && (
        <MenuItem
          pathname={pathname}
          name="Dashboard"
          href="/dashboard"
          icon={LayoutDashboard}
          />
        )}

        <MenuSection
          title="OPERATIONS"
          items={operations.filter(item => can(item.permission))}
          pathname={pathname}
        />

        <MenuSection
          title="FINANCE"
          items={finance.filter(item => can(item.permission))}
          pathname={pathname}
        />

      {can(PERMISSIONS.REPORTS_VIEW) && (
      <MenuSection
      title="INSIGHTS"
      items={insights.filter(item => can(item.permission))}
      pathname={pathname}
     />
     )}

     {can(PERMISSIONS.MIGRATION_VIEW) && (
      <MenuSection
      title="TOOLS"
      items={tools.filter(item => can(item.permission))}
      pathname={pathname}
     />
     )}

     {can(PERMISSIONS.TEAM_VIEW) && (
      <MenuSection
      title="TEAM"
      items={team.filter(item => can(item.permission))}
      pathname={pathname}
     />
     )}

      </nav>

      <div className="border-t border-slate-800 p-4 space-y-1">

        <MenuItem
          pathname={pathname}
          name="Profile"
          href="/profile"
          icon={User}
        />

        {can(PERMISSIONS.SETTINGS_VIEW) && (
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
            w-full
            flex
            items-center
            gap-3
            rounded-xl
            px-4
            py-3
            text-red-400
            hover:bg-red-950
            transition-all
          "
        >
          <LogOut size={18} />

          <span>
            Sign Out
          </span>

        </button>

        <div className="pt-4 border-t border-slate-800">

          <p className="text-xs text-slate-500">
            PoultryOps
          </p>

          <p className="text-xs text-slate-400 mt-1">
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
    icon: React.ComponentType<{ size: number }>;
    permission?: string;
  }>;
  pathname: string;
}) {
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
}: {
  pathname: string;
  href: string;
  name: string;
  icon: React.ComponentType<{ size: number }>;
}) {
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

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

      <span>
        {name}
      </span>

    </Link>
  );
}