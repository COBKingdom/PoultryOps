"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { getSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/plans";
import { supabase } from "@/lib/supabase";

import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";
import {
  CreditCard,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

type SubscriptionData = {
  plan: string | null;
  status: string;
  selected_plan: string | null;
  billing_cycle: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
};

export default function SettingsPage() {
  const { user, profile } = useAuth();

  const { data, loading: dashLoading } = useDashboard();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<number>(0);
  const [teamLoading, setTeamLoading] = useState(true);

  // ── Load subscription from the shared service (same as /settings/subscription) ──
  useEffect(() => {
    async function loadSubscription() {
      try {
        if (!profile?.farm_id) return;
        const data = await getSubscription(profile.farm_id);
        setSubscription(data);
      } catch (error) {
        console.error("Error loading subscription:", error);
      } finally {
        setSubLoading(false);
      }
    }
    loadSubscription();
  }, [profile]);

  // ── Load team members from the same API as the /team page ──
  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        const response = await fetch("/api/team", { headers });
        if (!response.ok) return;
        const data = await response.json();
        // Exclude the owner from the count — the plan limit applies to non-owner users only.
        const nonOwnerCount = (data.members || []).filter(
          (m: { role?: string }) => m.role !== "owner"
        ).length;
        setTeamMembers(nonOwnerCount);
      } catch (error) {
        console.error("Error loading team members:", error);
      } finally {
        setTeamLoading(false);
      }
    }
    loadTeamMembers();
  }, []);

  if (dashLoading) {
    return (
      <OwnerOnly>
        <AppShell email={user?.email}>
          <div className="p-6 md:p-8 space-y-6">
            <div className="animate-pulse space-y-3">
              <div className="h-8 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-72 bg-slate-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </AppShell>
      </OwnerOnly>
    );
  }

  // ── Derived from the shared subscription service + PLANS (same as /settings/subscription) ──
  const selectedPlanKey = (subscription?.selected_plan || "").toLowerCase() as
    | "solo"
    | "team"
    | "business"
    | "";

  const currentPlanName =
    selectedPlanKey && PLANS[selectedPlanKey]
      ? PLANS[selectedPlanKey].name
      : "—";

  const allowedUsers =
    selectedPlanKey && PLANS[selectedPlanKey]
      ? PLANS[selectedPlanKey].users
      : 0;

  const subscriptionStatus = (subscription?.status || "trial") as
    | "active"
    | "trial"
    | "expired"
    | "pending"
    | "cancelled";

  const planLabel =
    subscriptionStatus === "trial"
      ? `${currentPlanName} Trial`
      : `${currentPlanName} Plan`;

  const farm = data?.farm;

  // Status badge helpers
  const statusBadgeClass = () => {
    switch (subscriptionStatus) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "trial":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "expired":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  const statusIcon = () => {
    switch (subscriptionStatus) {
      case "active":
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case "trial":
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case "expired":
        return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      case "cancelled":
        return <XCircle className="w-3.5 h-3.5 mr-1" />;
      default:
        return null;
    }
  };

  const statusLabel = subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1);

  return (
    <OwnerOnly>
      <AppShell email={user?.email}>
        <div className="px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Settings
            </h1>
            <p className="mt-1.5 text-base text-slate-500">
              Manage your farm, team and PoultryOps account.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* CARD 1 — SUBSCRIPTION */}
            <Link href="/settings/subscription" className="group block">
              <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  {!subLoading && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass()} capitalize`}
                    >
                      {statusIcon()}
                      {statusLabel}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Subscription
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Manage your plan, billing and active limits.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Plan</span>
                    <span className="font-semibold text-slate-900">
                      {subLoading ? "—" : planLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {subLoading ? "—" : statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">User Limit</span>
                    <span className="font-semibold text-slate-900">
                      {subLoading ? "—" : `${allowedUsers} ${allowedUsers === 1 ? "User" : "Users"}`}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Manage Subscription
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>

            {/* CARD 2 — TEAM MANAGEMENT */}
            <Link href="/team" className="group block">
              <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Team Management
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Manage farm users, access and permissions.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Team Members</span>
                    <span className="font-semibold text-slate-900">
                      {teamLoading ? "—" : `${teamMembers} Member${teamMembers !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Max Allowed</span>
                    <span className="font-semibold text-slate-900">
                      {subLoading ? "—" : `${allowedUsers} User${allowedUsers !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Manage Team
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>

            {/* CARD 3 — FARM SETTINGS */}
            <Link href="/settings/farm" className="group block">
              <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {farm?.currency && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {farm.currency}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Farm Settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Manage your farm information and preferences.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Farm Name</span>
                    <span
                      className="font-semibold text-slate-900 truncate max-w-[140px]"
                      title={farm?.name || undefined}
                    >
                      {farm?.name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Farm Type</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {farm?.farm_type || "Poultry"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Currency</span>
                    <span className="font-semibold text-slate-900">
                      {farm?.currency || "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Manage Farm
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </AppShell>
    </OwnerOnly>
  );
}