"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

import AppShell from "@/components/layout/app-shell";
import { User, Building2, CreditCard, ExternalLink, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  const { data, loading } = useDashboard();

  if (loading) {
    return (
      <AppShell email={user?.email}>
        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-200 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const farm = data?.farm;
  const subscription = data?.subscription;

  const trialEnd = subscription?.trial_end
    ? new Date(subscription.trial_end)
    : null;

  const today = new Date();

  const isTrialExpired =
    trialEnd &&
    trialEnd.getTime() < today.getTime() &&
    subscription?.status === "trial";

  const daysRemaining = trialEnd
    ? Math.max(
        0,
        Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  function getRoleLabel(role?: string) {
    switch ((role || "").toLowerCase()) {
      case "owner":
        return "Farm Owner";
      case "manager":
        return "Farm Manager";
      case "data_entry":
        return "Data Entry Specialist";
      case "worker":
        return "Farm Worker";
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
    }
  }

  const formattedRole = getRoleLabel(profile?.role);

  return (
    <AppShell
      email={user?.email}
      farmName={farm?.name}
    >
      <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="text-base text-slate-500">
            Manage your account and view your farm membership.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ACCOUNT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Account</h2>
                <p className="text-xs text-slate-500">User identity and access role</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <span className="font-medium text-slate-900">{user?.email || "—"}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Account Role
                </span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900">{formattedRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FARM CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Farm Membership</h2>
                <p className="text-xs text-slate-500">Assigned farm details</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Farm Name
                </span>
                <span className="font-medium text-slate-900">{farm?.name || "—"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Farm Type
                  </span>
                  <span className="font-medium text-slate-900 capitalize">
                    {farm?.farm_type || "Poultry"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operating Currency
                  </span>
                  <span className="font-medium text-slate-900">{farm?.currency || "NGN"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Subscription Status</h2>
                  <p className="text-xs text-slate-500">Plan and trial details</p>
                </div>
              </div>

              {isTrialExpired ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Trial Expired
                </span>
              ) : subscription?.status === "active" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                  {subscription?.status || "Trial"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Plan
                </span>
                <span className="font-semibold text-slate-900 capitalize">
                  {subscription?.plan === "trial" ? "14-Day Trial" : subscription?.plan || "Trial"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Days Remaining
                </span>
                <span className={`font-semibold ${isTrialExpired ? "text-red-600" : "text-blue-600"}`}>
                  {daysRemaining} Days
                </span>
              </div>

              {trialEnd && (
                <div className="col-span-2 flex flex-col gap-1 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {subscription?.status === "trial" ? "Trial Ends On" : "Renewal Date"}
                  </span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{trialEnd.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              <p className="text-xs text-slate-500">Shortcuts to common administration tools</p>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-800 group"
              >
                <span>Go to Dashboard</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              {profile?.role === "owner" && (
                <>
                  <Link
                    href="/settings/farm"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-800 group"
                  >
                    <span>Manage Farm Settings</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </Link>

                  <Link
                    href="/settings/subscription"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-800 group"
                  >
                    <span>Manage Subscription</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}