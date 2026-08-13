"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFlutterwavePublicKey,
} from "@/lib/flutterwave";
import { PLANS, PLAN_FEATURES, PLAN_ORDER, ANNUAL_SAVINGS } from "@/lib/plans";
import { getSubscription } from "@/lib/subscription";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Clock,
  Users,
  CreditCard,
  Check,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

type SubscriptionData = {
  plan: string | null;
  status: string;
  selected_plan: string | null;
  billing_cycle: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
};

type PaymentRecord = {
  id: string;
  plan: string;
  billing_cycle: string;
  amount_paid: number;
  transaction_id: string;
  payment_reference: string;
  status: string;
  created_at: string;
};


export default function SubscriptionPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // ── Load subscription ─────────────────────────────────────────────────────
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

  // ── Load payment history ──────────────────────────────────────────────────
  async function loadPayments() {
    if (!profile?.farm_id) return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const res = await fetch(`/api/payments/history?farmId=${profile.farm_id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setPayments(json.payments || []);
    } catch (err: any) {
      setPaymentsError(err.message || "Unable to load payment history");
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => {
    if (profile?.farm_id) loadPayments();
  }, [profile]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPlanName = (plan: string | null | undefined): string => {
    if (!plan) return "—";
    const planData = PLANS[plan as keyof typeof PLANS];
    return planData?.name || plan;
  };

  const getAllowedUsers = (selectedPlan: string | null | undefined): number => {
    switch ((selectedPlan || "").toLowerCase()) {
      case "solo":
        return 1;
      case "team":
        return 3;
      case "business":
        return 6;
      default:
        return 0;
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.trial_end) return 0;
    const today = new Date();
    const trialEnd = new Date(subscription.trial_end);
    const diff = trialEnd.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ── selectTrialPlan ───────────────────────────────────────────────────────
  const selectTrialPlan = async (plan: "solo" | "team" | "business") => {
    try {
      if (!profile?.farm_id) return;
      
      // Update only the selected_plan field, no payment
const { data: updatedRows, error } = await supabase
  .from("subscriptions")
  .update({ selected_plan: plan })
  .eq("farm_id", profile.farm_id)
  .select();

console.log("UPDATE RESULT:", updatedRows);
console.log("UPDATE ERROR:", error);

if (error) {
  console.error("Update error:", error);
  alert("Failed to update trial plan");
  return;
}
      
      // Optimistically update the UI immediately
      setSubscription(prev => {
        if (!prev) return null;
        return { ...prev, selected_plan: plan };
      });
      
      alert(`${PLANS[plan].name} trial selected successfully`);
    } catch (error) {
      console.error("Error selecting trial plan:", error);
      alert("Failed to select trial plan");
    }
  };

  // ── payNow ────────────────────────────────────────────────────────────────
  const payNow = async (
    plan: "solo" | "team" | "business",
    billingCycle: "monthly" | "annual"
  ) => {
    console.log("payNow called", plan, billingCycle);
    console.log("Flutterwave object:", window.FlutterwaveCheckout);
    console.log("Public key:", process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY);
    try {
      if (!window.FlutterwaveCheckout) {
        alert("Payment system is still loading. Please try again.");
        return;
      }
      if (!profile) {
        alert("Profile not loaded");
        return;
      }

      const selectedPlan = PLANS[plan];
      const amount =
        billingCycle === "annual"
          ? selectedPlan.annual
          : selectedPlan.monthly;

      window.FlutterwaveCheckout({
        public_key: getFlutterwavePublicKey(),
        tx_ref: `POULTRYOPS-${Date.now()}`,
        amount,
        currency: "NGN",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: profile.email || "customer@poultryops.com",
          name: profile.full_name || "Farm Owner",
        },
        customizations: {
          title: "PoultryOps Subscription",
          description: `${selectedPlan.name} Plan`,
        },
        meta: {
          farm_id: profile.farm_id,
          plan,
          billing_cycle: billingCycle,
        },
        callback: async (response: any) => {
          try {
            setLoading(true);
            const verify = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transaction_id: response.transaction_id }),
            });
            const result = await verify.json();
            if (result.success) {
              alert("Subscription activated successfully");
              window.location.reload();
            } else {
              alert("Payment verification failed");
            }
          } catch (error) {
            console.error(error);
            alert("Verification failed");
          } finally {
            setLoading(false);
          }
        },
        onclose: () => {},
      });
    } catch (error) {
      console.error(error);
      alert("Unable to launch payment window");
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  const currentWorkspaceKey = (subscription?.selected_plan || "").toLowerCase() as
    | "solo"
    | "team"
    | "business"
    | "";

  const currentWorkspaceName =
    currentWorkspaceKey && PLANS[currentWorkspaceKey]
      ? PLANS[currentWorkspaceKey].name
      : getPlanName(subscription?.selected_plan);

  const subscriptionStatus = (subscription?.status || "trial") as
    | "active"
    | "trial"
    | "expired"
    | "pending"
    | "cancelled";

  const billingCycleLabel =
    subscription?.billing_cycle === "annual" ? "Annual" : "Monthly";

  const renewalSubLabel =
    subscriptionStatus === "trial" ? "Trial ends in" : "Next Renewal";

  const renewalValue =
    subscriptionStatus === "trial"
      ? `${getDaysRemaining()} day${getDaysRemaining() !== 1 ? "s" : ""} left`
      : formatDate(subscription?.next_billing_date || null);

  const allowedUsers = getAllowedUsers(subscription?.selected_plan);

  function planRibbon(planKey: string) {
    if (!currentWorkspaceKey) {
      return { label: "Subscribe", style: "bg-gray-100 text-gray-600 border-gray-200", isElevated: false };
    }
    const currentIdx = PLAN_ORDER.indexOf(currentWorkspaceKey as any);
    const thisIdx    = PLAN_ORDER.indexOf(planKey as any);
    if (planKey === currentWorkspaceKey) {
      return { label: "Current Plan", style: "bg-blue-600 text-white border-blue-600 shadow-sm", isElevated: true };
    }
    if (subscriptionStatus === "trial") {
      return { label: `Choose ${PLANS[planKey as keyof typeof PLANS]?.name || planKey} Trial`, style: "bg-indigo-100 text-indigo-700 border-indigo-200", isElevated: false };
    }
    if (thisIdx > currentIdx) {
      return { label: "Upgrade",   style: "bg-indigo-100 text-indigo-700 border-indigo-200", isElevated: false };
    }
    return { label: "Downgrade", style: "bg-gray-100 text-gray-600 border-gray-200", isElevated: false };
  }

  function statusBadgeClass() {
    switch (subscriptionStatus) {
      case "active":    return "bg-green-50 text-green-600 border-green-200";
      case "trial":     return "bg-amber-50 text-amber-600 border-amber-200";
      case "expired":   return "bg-red-50 text-red-600 border-red-200";
      case "pending":   return "bg-sky-50 text-sky-600 border-sky-200";
      case "cancelled": return "bg-gray-100 text-gray-500 border-gray-200";
      default:          return "bg-gray-100 text-gray-500 border-gray-200";
    }
  }

  function statusLabel() {
    return subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1);
  }

  function statusIcon() {
    switch (subscriptionStatus) {
      case "active":    return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case "trial":     return <Clock className="w-3.5 h-3.5 mr-1" />;
      case "expired":   return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      case "cancelled": return <XCircle className="w-3.5 h-3.5 mr-1" />;
      default:          return null;
    }
  }

  function overviewBorderClass() {
    switch (subscriptionStatus) {
      case "active":  return "border-l-green-500";
      case "trial":   return "border-l-amber-400";
      case "expired": return "border-l-red-500";
      default:        return "border-l-gray-300";
    }
  }

  function overviewGlowClass() {
    switch (subscriptionStatus) {
      case "active":  return "from-green-50/50";
      case "trial":   return "from-amber-50/50";
      case "expired": return "from-red-50/50";
      default:        return "from-gray-50/30";
    }
  }

  function paymentStatusBadge(s: string) {
    const sl = s.toLowerCase();
    if (sl === "successful" || sl === "success") {
      return (
        <span className="inline-flex items-center bg-green-50 text-green-700 border border-green-200/60 font-medium rounded-full px-2.5 py-0.5 text-xs">
          Successful
        </span>
      );
    }
    if (sl === "pending") {
      return (
        <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200/60 font-medium rounded-full px-2.5 py-0.5 text-xs">
          Pending
        </span>
      );
    }
    if (sl === "failed" || sl === "fail") {
      return (
        <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200/60 font-medium rounded-full px-2.5 py-0.5 text-xs">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center border border-gray-200 text-gray-600 rounded-full px-2.5 py-0.5 text-xs">
        {s}
      </span>
    );
  }

  function formatPaymentAmount(amount: number) {
    return `₦${amount.toLocaleString("en-NG")}`;
  }

  function formatPaymentDesc(payment: PaymentRecord) {
    const planName = PLANS[payment.plan as "solo" | "team" | "business"]?.name || payment.plan;
    const cycle = payment.billing_cycle === "annual" ? "Annual" : "Monthly";
    return `${planName} Plan — ${cycle}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 font-sans">
      <div className="max-w-[1200px] mx-auto pt-16 px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Billing &amp; Subscription
          </h1>
          <p className="text-lg text-gray-500">
            Manage your subscription, billing and payments.
          </p>
        </header>

        {/* ── Section 1 — Summary Cards ────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Current Plan */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="px-6 pt-6 pb-2">
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
            </div>
            <div className="px-6 pb-6">
              {subLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900">
                    {currentWorkspaceName}
                  </span>
                  <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass()}`}>
                    {statusLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="px-6 pt-6 pb-2">
              <p className="text-sm font-medium text-gray-500">Subscription Status</p>
            </div>
            <div className="px-6 pb-6">
              {subLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass()}`}>
                    {statusIcon()}
                    {statusLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Renewal / Trial */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="px-6 pt-6 pb-2">
              <p className="text-sm font-medium text-gray-500">{renewalSubLabel}</p>
            </div>
            <div className="px-6 pb-6">
              {subLoading ? (
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900">
                    {renewalValue}
                  </span>
                  <Clock className="w-5 h-5 text-gray-400" strokeWidth={2} />
                </div>
              )}
            </div>
          </div>

          {/* Allowed Users */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="px-6 pt-6 pb-2">
              <p className="text-sm font-medium text-gray-500">Allowed Users</p>
            </div>
            <div className="px-6 pb-6">
              {subLoading ? (
                <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900">
                    {allowedUsers}{" "}
                    <span className="text-base font-normal text-gray-500">
                      User{allowedUsers !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <Users className="w-5 h-5 text-gray-400" strokeWidth={2} />
                </div>
              )}
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="px-6 pt-6 pb-2">
              <p className="text-sm font-medium text-gray-500">Billing Cycle</p>
            </div>
            <div className="px-6 pb-6">
              {subLoading ? (
                <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900">
                    {subscriptionStatus === "trial" 
                      ? formatDate(subscription?.trial_start || null)
                      : (subscription?.billing_cycle ? billingCycleLabel : "Trial")}
                  </span>
                  <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-full border border-gray-200">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${subscription?.billing_cycle !== "annual" ? "bg-blue-600" : "bg-transparent"}`} />
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${subscription?.billing_cycle === "annual" ? "bg-blue-600" : "bg-transparent"}`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2 — Subscription Overview ───────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Subscription Overview
          </h2>

          {subLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-12">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm border-l-4 ${overviewBorderClass()} group hover:shadow-md transition-all duration-200`}
            >
              <div
                className={`absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r ${overviewGlowClass()} to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="p-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-12 items-center">
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Current Plan
                    </p>
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-bold tracking-tight text-gray-900">
                        {currentWorkspaceName}
                      </h3>
                      <span
                        className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${statusBadgeClass()}`}
                      >
                        {statusIcon()}
                        {statusLabel()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Allowed Users</p>
                    <p className="text-lg font-medium text-gray-900">
                      {allowedUsers} user{allowedUsers !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Billing Cycle</p>
                    <p className="text-lg font-medium text-gray-900">
                      {subscription?.billing_cycle ? billingCycleLabel : "Trial"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      {subscriptionStatus === "trial" ? "Trial Ends" : "Renewal Date"}
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {subscriptionStatus === "trial"
                        ? formatDate(subscription?.trial_end || null)
                        : formatDate(subscription?.next_billing_date || null)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3 — Pricing Plans ────────────────────────────────────── */}
        <section className="space-y-6 pt-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Available Plans
            </h2>
            <p className="text-gray-500">Choose the right plan for your farm&apos;s needs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PLAN_ORDER.map((planKey) => {
              const plan   = PLANS[planKey];
              const ribbon = planRibbon(planKey);
              const isCurrentPlan = planKey === currentWorkspaceKey;

              return (
                <div
                  key={planKey}
                  className={`relative flex flex-col bg-white rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
                    ${ribbon.isElevated
                      ? "border border-blue-600/40 shadow-md ring-1 ring-blue-600/10"
                      : "border border-gray-200 shadow-sm"}
                  `}
                >
                  {/* Ribbon */}
                  <div className="absolute -top-3 inset-x-0 flex justify-center z-10">
                    <span
                      className={`${ribbon.style} border uppercase text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm`}
                    >
                      {ribbon.label}
                    </span>
                  </div>

                  {/* Header */}
                  <div className="text-center pt-8 pb-4 px-6">
                    <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col px-6">
                    <div className="mb-8 space-y-5">
                      {/* Monthly price */}
                      <div className="flex flex-col items-center pb-5 border-b border-gray-200/70">
                        <p className="text-sm font-medium text-gray-500 mb-1">Monthly</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight text-gray-900">
                            ₦{plan.monthly.toLocaleString("en-NG")}
                          </span>
                          <span className="text-sm font-medium text-gray-500">/mo</span>
                        </div>
                      </div>

                      {/* Annual price */}
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-500 mb-1">Annual</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight text-gray-900">
                            ₦{plan.annual.toLocaleString("en-NG")}
                          </span>
                          <span className="text-sm font-medium text-gray-500">/yr</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center bg-green-50 text-green-600 rounded-full px-2 py-0.5 text-xs font-medium">
                            {ANNUAL_SAVINGS[planKey]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 flex-1">
                      <p className="text-sm font-semibold tracking-wider uppercase text-gray-900">
                        Features included
                      </p>
                      <ul className="space-y-3">
                        {PLAN_FEATURES[planKey].map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col gap-3 p-6 bg-gray-50/50 mt-4 rounded-b-2xl border-t border-gray-200">
<button
  className={`w-full h-11 text-base rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    ribbon.isElevated
      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm"
  }`}
  disabled={loading || isCurrentPlan}
  onClick={() => payNow(planKey, "monthly")}
>
  {isCurrentPlan ? (
    <span className="flex items-center justify-center gap-2">
      <CheckCircle2 className="w-4 h-4" />
      Current Plan
    </span>
) : (
  "Subscribe Monthly"
)}
</button>
                    <button
                      className="w-full h-11 text-base rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                      onClick={() => payNow(planKey, "annual")}
                    >
                      {isCurrentPlan ? "Renew Annual" : "Subscribe Annual"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4 — Payment History ──────────────────────────────────── */}
        <section className="space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Payment History
            </h2>
            {!paymentsLoading && (
              <button
                onClick={loadPayments}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Refresh
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 h-11">Date</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 h-11">Description</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 h-11">Amount</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 h-11">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-600 h-11 text-right">Reference</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {/* Loading state */}
                  {paymentsLoading &&
                    [...Array(3)].map((_, i) => (
                      <tr key={`skel-${i}`}>
                        <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="h-4 w-48 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" /></td>
                        <td className="px-4 py-4 text-right"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                      </tr>
                    ))}

                  {/* Error state */}
                  {!paymentsLoading && paymentsError && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-red-600">
                          <AlertCircle className="w-6 h-6" />
                          <p className="text-sm">{paymentsError}</p>
                          <button
                            onClick={loadPayments}
                            className="inline-flex items-center text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Empty state */}
                  {!paymentsLoading && !paymentsError && payments.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
                            <CreditCard className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">
                            No payment history
                          </h3>
                          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                            You haven&apos;t made any payments yet. Your first invoice will appear
                            here once processed.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Data rows */}
                  {!paymentsLoading &&
                    !paymentsError &&
                    payments.map((payment, i) => (
                      <tr
                        key={payment.id || i}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatPaymentDesc(payment)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {formatPaymentAmount(payment.amount_paid)}
                        </td>
                        <td className="px-4 py-4">
                          {paymentStatusBadge(payment.status)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-xs font-mono text-gray-400 select-all">
                            {payment.payment_reference || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Verification overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-xl px-6 py-4">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Verifying payment…</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
