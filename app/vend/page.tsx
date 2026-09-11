"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Handshake,
  Home,
  Link2,
  LogOut,
  Menu,
  PanelLeftClose,
  Share2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Partner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  vend_code: string;
  status: string;
  territory: string | null;
  joined_at: string;
  referralLink?: string;
};

type Summary = {
  totalCustomers: number;
  activeCustomers: number;
  totalEarned: number;
  paidCommission: number;
  pendingCommission: number;
};

type Customer = {
  id: string;
  farmId: string;
  farmName: string;
  source: string;
  attributedAt: string;
  commissionTotal: number;
};

type Commission = {
  id: string;
  farm_id: string | null;
  commission_type: string;
  amount: number;
  status: string;
  earned_at: string;
  paid_at: string | null;
  notes: string | null;
};

type Section =
  | "overview"
  | "customers"
  | "referral"
  | "earnings";

export default function VENDPage() {
  const router = useRouter();

  const [partner, setPartner] = useState<Partner | null>(null);

  const [summary, setSummary] = useState<Summary>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalEarned: 0,
    paidCommission: 0,
    pendingCommission: 0,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [earnings, setEarnings] = useState<Commission[]>([]);

  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPortal();
  }, []);

  async function loadPortal() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/vend", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load your VEND portal"
        );
      }

      setPartner(data.partner);

      setSummary({
        totalCustomers:
          data.summary?.totalCustomers || 0,
        activeCustomers:
          data.summary?.activeCustomers || 0,
        totalEarned:
          data.summary?.totalEarned || 0,
        paidCommission:
          data.summary?.paidCommission || 0,
        pendingCommission:
          data.summary?.pendingCommission || 0,
      });

      setCustomers(data.customers || []);
      setEarnings(data.earnings || []);
    } catch (err) {
      console.error("VEND portal error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your VEND portal"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setAccountMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function formatDate(value: string) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  function commissionLabel(type: string) {
    switch (type) {
      case "new_customer":
        return "New customer";

      case "renewal":
        return "Renewal";

      default:
        return type
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) =>
            char.toUpperCase()
          );
    }
  }

  function selectSection(section: Section) {
    setActiveSection(section);
    setMobileOpen(false);
  }

  const firstName =
    partner?.full_name
      ?.trim()
      .split(/\s+/)[0] || "Partner";

  const initials =
    partner?.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "VE";

  const referralLink =
    partner?.referralLink ||
    (partner?.vend_code
      ? `${window.location.origin}/register?ref=${encodeURIComponent(
          partner.vend_code
        )}`
      : "");

  const qrUrl = useMemo(() => {
    if (!referralLink) return "";

    return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=16&data=${encodeURIComponent(
      referralLink
    )}`;
  }, [referralLink]);

  async function copyReferralLink() {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(
        referralLink
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      setError(
        "Unable to copy the referral link. Please copy it manually."
      );
    }
  }

  async function shareReferralLink() {
    if (!referralLink) return;

    const shareData = {
      title: "PoultryOps",
      text: "Join PoultryOps through my referral link.",
      url: referralLink,
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share(shareData);
        return;
      }

      await copyReferralLink();
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      await copyReferralLink();
    }
  }

  function openReferralLink() {
    if (!referralLink) return;

    window.open(
      referralLink,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadQr() {
    if (!qrUrl) return;

    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${partner?.vend_code || "poultryops-vend"}-qr.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const navigation = [
    {
      id: "overview" as Section,
      label: "Overview",
      icon: Home,
    },
    {
      id: "customers" as Section,
      label: "My Customers",
      icon: Users,
    },
    {
      id: "referral" as Section,
      label: "My Referral Link",
      icon: Link2,
    },
    {
      id: "earnings" as Section,
      label: "My Earnings",
      icon: WalletCards,
    },
  ];

  const pageTitle =
    activeSection === "overview"
      ? `Welcome back, ${firstName}!`
      : activeSection === "customers"
        ? "My Customers"
        : activeSection === "referral"
          ? "My Referral Link"
          : "My Earnings";

  const pageDescription =
    activeSection === "overview"
      ? "Track your referrals, customers and earnings from one simple workspace."
      : activeSection === "customers"
        ? "See the poultry businesses that came through your VEND referral."
        : activeSection === "referral"
          ? "Share your unique PoultryOps referral link and bring more poultry businesses to the platform."
          : "A clear view of your PoultryOps VEND commissions and payout status.";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#09295c] shadow-lg">
            <Handshake className="h-7 w-7 text-[#f5b942]" />
          </div>

          <div className="text-sm font-medium text-slate-500">
            Loading your VEND portal...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
            <X className="h-6 w-6 text-red-500" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#081f46]">
            Unable to load portal
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-600">
            {error}
          </p>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={loadPortal}
              className="rounded-xl bg-[#0b57d0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0849b5]"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#0b1f3a]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#031631]/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden bg-[#061f49] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="px-6 pb-5 pt-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f5b942]/50 bg-[#f5b942]/10">
              <Handshake className="h-6 w-6 text-[#f5b942]" />
            </div>

            <div>
              <div className="text-[15px] font-extrabold tracking-[0.24em] text-white">
                POULTRYOPS
              </div>

              <div className="mt-0.5 text-xs font-medium text-[#f5c75d]">
                VEND Partner Portal
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Partner identity */}
        <div className="px-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#f5b942] bg-[#0d3269] text-sm font-bold text-[#f5c75d]">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {partner?.full_name ||
                    "VEND Partner"}
                </p>

                <p className="mt-0.5 text-xs text-white/55">
                  {partner?.vend_code}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f5b942]/10 px-3 py-2 text-xs font-semibold text-[#f5c75d]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {partner?.status === "active"
                ? "Active VEND Partner"
                : "VEND Partner"}
            </div>
          </div>
        </div>

        <nav className="mt-7 flex-1 px-4">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            Partner Workspace
          </p>

          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    selectSection(item.id)
                  }
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#1769f5] text-white shadow-lg shadow-[#1769f5]/20"
                      : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      active
                        ? "text-white"
                        : "text-white/50 group-hover:text-[#f5c75d]"
                    }`}
                  />

                  <span>{item.label}</span>

                  {item.id === "customers" &&
                    summary.totalCustomers > 0 && (
                      <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                        {summary.totalCustomers}
                      </span>
                    )}
                </button>
              );
            })}
          </div>

          {/* Referral CTA */}
          <div className="mt-8 rounded-2xl border border-[#f5b942]/35 bg-gradient-to-br from-[#0d3269] to-[#092653] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5b942]/15">
              <Link2 className="h-5 w-5 text-[#f5c75d]" />
            </div>

            <p className="mt-4 text-sm font-bold text-white">
              Ready to earn?
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Share your referral link with poultry farmers and businesses.
            </p>

            <button
              type="button"
              onClick={() =>
                selectSection("referral")
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5b942] px-3 py-2.5 text-xs font-bold text-[#092653] transition hover:bg-[#ffd064]"
            >
              Get My Link
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/55 transition hover:bg-white/[0.07] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-h-screen lg:pl-[280px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-5 sm:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#092653] shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                  <PanelLeftClose className="h-5 w-5" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b57d0]">
                  PoultryOps
                </p>

                <p className="text-sm font-semibold text-[#0b1f3a]">
                  VEND Partner Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#092653]"
                aria-label="Notifications"
              >
                <Bell className="h-[19px] w-[19px]" />

                {summary.pendingCommission > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f5b942] ring-2 ring-white" />
                )}
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setAccountMenuOpen(
                      (open) => !open
                    )
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#092653] text-xs font-bold text-[#f5c75d]">
                    {initials}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-bold text-[#0b1f3a]">
                      {partner?.full_name ||
                        "VEND Partner"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {partner?.vend_code}
                    </p>
                  </div>

                  <ChevronDown
                    className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                      accountMenuOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {accountMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close account menu"
                      onClick={() =>
                        setAccountMenuOpen(false)
                      }
                      className="fixed inset-0 z-40 cursor-default bg-transparent"
                    />

                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(8,31,70,0.14)]"
                    >
                      <div className="border-b border-slate-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#092653] text-sm font-bold text-[#f5c75d]">
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#0b1f3a]">
                              {partner?.full_name ||
                                "VEND Partner"}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {partner?.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              VEND Code
                            </span>

                            <span className="font-mono text-xs font-bold text-[#0b1f3a]">
                              {partner?.vend_code}
                            </span>
                          </div>

                          {partner?.territory && (
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Territory
                              </span>

                              <span className="truncate text-xs font-semibold text-slate-600">
                                {partner.territory}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-2">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                            <LogOut className="h-4 w-4" />
                          </span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          {/* Heading */}
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f5b942]" />

                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b57d0]">
                    VEND Partner Portal
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[#081f46] sm:text-4xl">
                  {pageTitle}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {pageDescription}
                </p>
              </div>

              {activeSection === "overview" && (
                <div className="hidden rounded-2xl border border-[#f0d28a] bg-[#fffaf0] px-4 py-3 sm:flex sm:items-center sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5b942]/15">
                    <Handshake className="h-5 w-5 text-[#b77b00]" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b6a00]">
                      Partner Status
                    </p>

                    <p className="text-sm font-bold text-[#704c00]">
                      {partner?.status === "active"
                        ? "Active Partner"
                        : "Partner"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Overview */}
          {activeSection === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Customers Referred"
                  value={summary.totalCustomers}
                  subtitle={`${summary.activeCustomers} active`}
                  icon={Users}
                  iconClass="bg-blue-50 text-blue-600"
                  accent="blue"
                  onClick={() =>
                    selectSection("customers")
                  }
                />

                <MetricCard
                  label="Successful Customers"
                  value={summary.activeCustomers}
                  subtitle="Active PoultryOps customers"
                  icon={CheckCircle2}
                  iconClass="bg-emerald-50 text-emerald-600"
                  accent="green"
                  onClick={() =>
                    selectSection("customers")
                  }
                />

                <MetricCard
                  label="Total Earned"
                  value={formatMoney(
                    summary.totalEarned
                  )}
                  subtitle={`${formatMoney(
                    summary.paidCommission
                  )} paid`}
                  icon={CircleDollarSign}
                  iconClass="bg-violet-50 text-violet-600"
                  accent="purple"
                  onClick={() =>
                    selectSection("earnings")
                  }
                />

                <MetricCard
                  label="Pending"
                  value={formatMoney(
                    summary.pendingCommission
                  )}
                  subtitle="Awaiting payout"
                  icon={Clock3}
                  iconClass="bg-amber-50 text-amber-600"
                  accent="gold"
                  onClick={() =>
                    selectSection("earnings")
                  }
                />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
                {/* Referral card */}
                <div className="relative overflow-hidden rounded-3xl bg-[#082b62] shadow-[0_15px_40px_rgba(6,31,73,0.18)]">
                  <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#1769f5]/20 blur-2xl" />
                  <div className="absolute -bottom-28 right-40 h-60 w-60 rounded-full bg-[#f5b942]/10 blur-3xl" />

                  <div className="relative px-6 py-7 sm:px-8 lg:px-9">
                    <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f5b942]/30 bg-[#f5b942]/10">
                          <Link2 className="h-6 w-6 text-[#f5c75d]" />
                        </div>

                        <div>
                          <p className="text-lg font-bold text-white">
                            Your referral link is ready.
                          </p>

                          <p className="mt-1 max-w-xl text-sm leading-6 text-white/60">
                            Share your unique link with poultry farmers. Every successful referral is tracked to your VEND account.
                          </p>

                          <div className="mt-5 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.07] p-3 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1 truncate font-mono text-xs text-white/75">
                              {referralLink ||
                                "Referral link unavailable"}
                            </div>

                            <button
                              type="button"
                              onClick={copyReferralLink}
                              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#092653] transition hover:bg-slate-100"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          selectSection("referral")
                        }
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f5b942] px-5 py-3 text-sm font-bold text-[#082b62] shadow-lg transition hover:bg-[#ffd064]"
                      >
                        Share My Link
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Earnings summary */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <WalletCards className="h-4 w-4" />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-[#081f46]">
                          Earnings Summary
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Your VEND commission position
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <EarningsRow
                      label="Total earned"
                      value={formatMoney(
                        summary.totalEarned
                      )}
                      icon={CircleDollarSign}
                      iconClass="bg-violet-50 text-violet-600"
                    />

                    <EarningsRow
                      label="Paid"
                      value={formatMoney(
                        summary.paidCommission
                      )}
                      icon={CheckCircle2}
                      iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <EarningsRow
                      label="Pending"
                      value={formatMoney(
                        summary.pendingCommission
                      )}
                      icon={Clock3}
                      iconClass="bg-amber-50 text-amber-600"
                      last
                    />

                    <button
                      type="button"
                      onClick={() =>
                        selectSection("earnings")
                      }
                      className="mt-5 flex items-center gap-2 text-xs font-bold text-[#0b57d0]"
                    >
                      View earnings history
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <RecentCard
                  title="Recent Customers"
                  subtitle="Latest businesses attributed to you"
                  icon={Users}
                  empty={customers.length === 0}
                  emptyTitle="No customers yet"
                  emptyText="Customers who register through your referral link will appear here."
                  actionLabel="View all customers"
                  onAction={() =>
                    selectSection("customers")
                  }
                >
                  {customers.slice(0, 4).map(
                    (customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
                            <Users className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0b1f3a]">
                              {customer.farmName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(
                                customer.attributedAt
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="ml-3 shrink-0 text-sm font-bold text-[#0b1f3a]">
                          {formatMoney(
                            customer.commissionTotal
                          )}
                        </p>
                      </div>
                    )
                  )}
                </RecentCard>

                <RecentCard
                  title="Recent Earnings"
                  subtitle="Latest commission activity"
                  icon={WalletCards}
                  empty={earnings.length === 0}
                  emptyTitle="No earnings yet"
                  emptyText="When a qualifying customer payment creates your commission, it will appear here."
                  actionLabel="View all earnings"
                  onAction={() =>
                    selectSection("earnings")
                  }
                >
                  {earnings.slice(0, 4).map(
                    (commission) => (
                      <div
                        key={commission.id}
                        className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <CircleDollarSign className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#0b1f3a]">
                              {commissionLabel(
                                commission.commission_type
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(
                                commission.earned_at
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-[#0b1f3a]">
                          {formatMoney(
                            commission.amount
                          )}
                        </p>
                      </div>
                    )
                  )}
                </RecentCard>
              </div>
            </>
          )}

          {/* Customers */}
          {activeSection === "customers" && (
            <DataTableCard
              title="Customers I Referred"
              subtitle="Poultry businesses attributed to your VEND account."
              empty={customers.length === 0}
              emptyTitle="No customers yet"
              emptyText="Customers who register through your referral link will appear here."
              icon={Users}
            >
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
                        <Users className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="font-semibold text-[#0b1f3a]">
                          {customer.farmName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Poultry customer
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(
                      customer.attributedAt
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                      {customer.source ||
                        "Referral"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right font-bold text-[#0b1f3a]">
                    {formatMoney(
                      customer.commissionTotal
                    )}
                  </td>
                </tr>
              ))}
            </DataTableCard>
          )}

          {/* Referral */}
          {activeSection === "referral" && (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
                      <Link2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[#081f46]">
                        My Referral Link
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Your unique VEND referral address.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      VEND Code
                    </p>

                    <p className="mt-2 font-mono text-xl font-extrabold text-[#081f46]">
                      {partner?.vend_code ||
                        "—"}
                    </p>
                  </div>

                  <div className="mt-5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Referral URL
                    </label>

                    <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 break-all px-3 py-2 font-mono text-xs leading-5 text-slate-600">
                        {referralLink ||
                          "Referral link unavailable"}
                      </div>

                      <button
                        type="button"
                        onClick={copyReferralLink}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b57d0] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#0849b5]"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={shareReferralLink}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#092653] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d3269]"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>

                    <button
                      type="button"
                      onClick={openReferralLink}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={downloadQr}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />
                      QR Code
                    </button>
                  </div>

                  <div className="mt-7 rounded-2xl border border-[#f0d28a] bg-[#fffaf0] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5b942]/15">
                        <Handshake className="h-4 w-4 text-[#b77b00]" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#704c00]">
                          How your referral works
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#8b6a22]">
                          Share your link with poultry farmers. When they register through your link, PoultryOps records the referral against your VEND account. Qualifying customer payments can then generate your VEND commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR */}
              <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-base font-bold text-[#081f46]">
                    Your QR Code
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Farmers can scan this code to open your referral link.
                  </p>
                </div>

                <div className="flex flex-col items-center px-6 py-8">
                  {qrUrl ? (
                    <>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <img
                          src={qrUrl}
                          alt={`QR code for ${partner?.vend_code || "VEND"} referral link`}
                          className="h-[230px] w-[230px]"
                        />
                      </div>

                      <p className="mt-5 font-mono text-sm font-bold text-[#081f46]">
                        {partner?.vend_code}
                      </p>

                      <button
                        type="button"
                        onClick={downloadQr}
                        className="mt-5 flex items-center gap-2 rounded-xl bg-[#0b57d0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0849b5]"
                      >
                        <Download className="h-4 w-4" />
                        Download QR Code
                      </button>
                    </>
                  ) : (
                    <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
                      QR code unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Earnings */}
          {activeSection === "earnings" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Total Earned"
                  value={formatMoney(
                    summary.totalEarned
                  )}
                  subtitle="All recorded commissions"
                  icon={CircleDollarSign}
                  iconClass="bg-violet-50 text-violet-600"
                  accent="purple"
                />

                <MetricCard
                  label="Paid"
                  value={formatMoney(
                    summary.paidCommission
                  )}
                  subtitle="Commission already paid"
                  icon={CheckCircle2}
                  iconClass="bg-emerald-50 text-emerald-600"
                  accent="green"
                />

                <MetricCard
                  label="Pending"
                  value={formatMoney(
                    summary.pendingCommission
                  )}
                  subtitle="Awaiting payout"
                  icon={Clock3}
                  iconClass="bg-amber-50 text-amber-600"
                  accent="gold"
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-base font-bold text-[#081f46]">
                    Commission History
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Your recorded PoultryOps VEND commissions.
                  </p>
                </div>

                {earnings.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0b57d0]">
                      <WalletCards className="h-6 w-6" />
                    </div>

                    <p className="mt-5 text-sm font-bold text-[#0b1f3a]">
                      No commission records yet
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
                      Your commission history will appear here when qualifying customer payments are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-6 py-3.5">
                            Date
                          </th>

                          <th className="px-6 py-3.5">
                            Commission
                          </th>

                          <th className="px-6 py-3.5">
                            Status
                          </th>

                          <th className="px-6 py-3.5">
                            Paid
                          </th>

                          <th className="px-6 py-3.5 text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {earnings.map(
                          (commission) => (
                            <tr
                              key={
                                commission.id
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {formatDate(
                                  commission.earned_at
                                )}
                              </td>

                              <td className="px-6 py-4 font-semibold text-[#0b1f3a]">
                                {commissionLabel(
                                  commission.commission_type
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                    commission.status ===
                                    "paid"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {
                                    commission.status
                                  }
                                </span>
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-500">
                                {commission.paid_at
                                  ? formatDate(
                                      commission.paid_at
                                    )
                                  : "—"}
                              </td>

                              <td className="px-6 py-4 text-right font-bold text-[#0b1f3a]">
                                {formatMoney(
                                  commission.amount
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable components                                                        */
/* -------------------------------------------------------------------------- */

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: typeof Users;
  iconClass: string;
  accent:
    | "blue"
    | "green"
    | "purple"
    | "gold";
  onClick?: () => void;
}) {
  const accentClasses = {
    blue: "bg-[#1769f5]",
    green: "bg-emerald-500",
    purple: "bg-violet-500",
    gold: "bg-[#f5b942]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_8px_25px_rgba(8,31,70,0.045)] transition duration-200 ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(8,31,70,0.09)]"
          : "cursor-default"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${accentClasses[accent]}`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {onClick && (
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0b57d0]" />
        )}
      </div>

      <p className="mt-5 text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-[#081f46]">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        {subtitle}
      </p>
    </button>
  );
}

function EarningsRow({
  label,
  value,
  icon: Icon,
  iconClass,
  last = false,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  iconClass: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${
        last
          ? ""
          : "border-b border-slate-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold text-[#0b1f3a]">
        {value}
      </span>
    </div>
  );
}

function RecentCard({
  title,
  subtitle,
  icon: Icon,
  empty,
  emptyTitle,
  emptyText,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  empty: boolean;
  emptyTitle: string;
  emptyText: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#0b57d0]">
            <Icon className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#081f46]">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAction}
          className="hidden items-center gap-1.5 text-xs font-bold text-[#0b57d0] sm:flex"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-6 py-4">
        {empty ? (
          <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Icon className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#0b1f3a]">
              {emptyTitle}
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
              {emptyText}
            </p>

            <button
              type="button"
              onClick={onAction}
              className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#0b57d0]"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {children}

            <button
              type="button"
              onClick={onAction}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#0b57d0] sm:hidden"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DataTableCard({
  title,
  subtitle,
  icon: Icon,
  empty,
  emptyTitle,
  emptyText,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  empty: boolean;
  emptyTitle: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#081f46]">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {empty ? (
        <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
            <Icon className="h-7 w-7" />
          </div>

          <p className="mt-5 text-sm font-bold text-[#0b1f3a]">
            {emptyTitle}
          </p>

          <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">
                  Customer
                </th>

                <th className="px-6 py-3.5">
                  Referred
                </th>

                <th className="px-6 py-3.5">
                  Source
                </th>

                <th className="px-6 py-3.5 text-right">
                  Earnings
                </th>
              </tr>
            </thead>

            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
