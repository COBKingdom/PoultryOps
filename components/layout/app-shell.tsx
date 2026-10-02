"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { usePermissions } from "@/lib/permissions";
import { getSubscription } from "@/lib/subscription";

import Sidebar from "./sidebar";
import Topbar from "./topbar";
import MobileSidebar from "./mobile-sidebar";
import DemoModeBanner from "./demo-mode-banner";

type Props = {
  email?: string;
  children: ReactNode;
};

export default function AppShell({
  email,
  children,
}: Props) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const {
    user,
    profile,
    loading: authLoading,
  } = useAuth();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const {
    isPlatformAdmin,
    isDemoMode,
    loading: permissionsLoading,
  } = usePermissions();

  /*
   * Normal farms continue to use the existing
   * subscription-expiry enforcement.
   *
   * Demo farms are deliberately excluded.
   */
  useEffect(() => {
    if (
      authLoading ||
      permissionsLoading ||
      !user ||
      isPlatformAdmin ||
      isDemoMode ||
      !profile?.farm_id
    ) {
      return;
    }

    let cancelled = false;

    async function checkExpiry() {
      try {
        const sub =
          await getSubscription(
            profile.farm_id
          );

        if (cancelled) {
          return;
        }

        const status =
          sub?.status;

        const trialEnd =
          sub?.trial_end;

        const isExpired =
          status === "expired" ||
          (status === "trial" &&
            trialEnd &&
            new Date(
              trialEnd
            ).getTime() <=
              Date.now());

        if (isExpired) {
          router.replace(
            "/settings/subscription"
          );
        }
      } catch (error) {
        console.error(
          "Error checking subscription expiry:",
          error
        );
      }
    }

    checkExpiry();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    permissionsLoading,
    user,
    profile,
    isPlatformAdmin,
    isDemoMode,
    router,
  ]);

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Desktop navigation */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile navigation */}
      <MobileSidebar
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      <main className="min-w-0 flex-1">

        {/* Mobile header */}
        <div className="border-b bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() =>
              setOpen(true)
            }
            aria-label="Open navigation"
            className="inline-flex items-center justify-center rounded-md p-1 text-slate-700 hover:bg-slate-100"
          >
            <Menu />
          </button>
        </div>

        {/* Demo banner */}
        {isDemoMode && (
          <DemoModeBanner />
        )}

        {/* Existing application topbar */}
        <Topbar
          email={email}
          farmName={
            farmLoading
              ? undefined
              : farm?.name
          }
        />

        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>

      </main>
    </div>
  );
}