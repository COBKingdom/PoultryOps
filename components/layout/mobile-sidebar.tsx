"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

import {
  X,
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
  Settings,
  Upload,
  User,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSidebar({
  open,
  onClose,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const { can, isPlatformAdmin } = usePermissions();

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
      permission: PERMISSIONS.EGGS_VIEW,
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
      name: "Isolation",
      href: "/isolation",
      icon: Activity,
      permission: PERMISSIONS.ISOLATION_VIEW,
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
      icon: BarChart3,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartColumn,
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

  if (!open) {
    return null;
  }

  async function handleSignOut() {
    onClose();

    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      <aside
        className="
          fixed left-0 top-0 z-50 flex h-full w-72
          flex-col bg-slate-950 text-white
        "
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl bg-blue-600 font-bold
                "
              >
                P
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  PoultryOps
                </h2>

                <p className="text-xs text-slate-400">
                  Poultry Farm Management
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {can(PERMISSIONS.DASHBOARD_VIEW) && (
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
            items={operations.filter((item) =>
              can(item.permission)
            )}
            pathname={pathname}
            onClose={onClose}
          />

          <MenuSection
            title="FINANCE"
            items={finance.filter((item) =>
              can(item.permission)
            )}
            pathname={pathname}
            onClose={onClose}
          />

          <MenuSection
            title="INSIGHTS"
            items={insights.filter((item) =>
              can(item.permission)
            )}
            pathname={pathname}
            onClose={onClose}
          />

          <MenuSection
            title="TOOLS"
            items={tools.filter((item) =>
              can(item.permission)
            )}
            pathname={pathname}
            onClose={onClose}
          />

          <MenuSection
            title="TEAM"
            items={team.filter((item) =>
              can(item.permission)
            )}
            pathname={pathname}
            onClose={onClose}
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
              onClose={onClose}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-1 border-t border-slate-800 p-4">
          <MenuItem
            pathname={pathname}
            href="/profile"
            name="Profile"
            icon={User}
            onClose={onClose}
          />

          {can(PERMISSIONS.SETTINGS_VIEW) && (
            <MenuItem
              pathname={pathname}
              href="/settings"
              name="Settings"
              icon={Settings}
              onClose={onClose}
            />
          )}

          <button
            onClick={handleSignOut}
            className="
              flex w-full items-center gap-3 rounded-xl
              px-4 py-3 text-red-400 transition-all
              hover:bg-red-950
            "
          >
            <LogOut size={18} />

            <span>Sign Out</span>
          </button>
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
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      <p
        className="
          mb-2 text-xs font-semibold tracking-wider
          text-slate-500
        "
      >
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item: any) => (
          <MenuItem
            key={item.href}
            pathname={pathname}
            onClose={onClose}
            {...item}
          />
        ))}
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
    pathname === href ||
    (href !== "/" &&
      pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`
        flex items-center gap-3 rounded-xl px-4 py-3
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