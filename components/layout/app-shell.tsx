"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Menu } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { getSubscription } from "@/lib/subscription";

import Sidebar from "./sidebar";
import Topbar from "./topbar";
import MobileSidebar from "./mobile-sidebar";

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

  const { user, profile, loading: authLoading } = useAuth();
  const { farm, loading: farmLoading } = useCurrentFarm();

  // ── Real-time trial expiry enforcement ────────────────────────────────────
  // AppShell wraps every operational page (dashboard, flocks, eggs, feed, etc.)
  // but NOT the subscription page. If the trial has expired, redirect the user
  // to /settings/subscription where they can subscribe/renew.
  useEffect(() => {
    if (authLoading || !user || !profile?.farm_id) return;

    let cancelled = false;

    async function checkExpiry() {
      try {
        const sub = await getSubscription(profile.farm_id);
        if (cancelled) return;

        const status = sub?.status;
        const trialEnd = sub?.trial_end;

        const isExpired =
          status === "expired" ||
          (status === "trial" &&
            trialEnd &&
            new Date(trialEnd).getTime() <= Date.now());

        if (isExpired) {
          router.replace("/settings/subscription");
        }
      } catch (error) {
        console.error("Error checking subscription expiry:", error);
      }
    }

    checkExpiry();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, profile, router]);

  return (
    <div className="flex min-h-screen bg-slate-100">

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <MobileSidebar
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      <main className="flex-1 min-w-0">

        <div className="lg:hidden bg-white border-b px-4 py-3">

          <button
            onClick={() =>
              setOpen(true)
            }
          >
            <Menu />
          </button>

        </div>

        <Topbar
         email={email}
         farmName={farmLoading ? undefined : farm?.name}
        />

        <div className="p-4 md:p-6">
          {children}
        </div>

      </main>

    </div>
  );
}