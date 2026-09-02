"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Handshake,
  Home,
  LogOut,
  Menu,
  Network,
  PanelLeftClose,
  Target,
  TrendingUp,
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
  pogp_code: string;
  status: string;
  territory: string | null;
  joined_at: string;
};

type Summary = {
  totalCustomers: number;
  activeCustomers: number;
  totalProspects: number;
  totalEarned: number;
  paidCommission: number;
  pendingCommission: number;
  networkPartners: number;
  networkCustomers: number;
  networkCommissionTotal: number;
};

type Customer = {
  id: string;
  farmId: string;
  farmName: string;
  source: string;
  attributedAt: string;
  commissionTotal: number;
};

type Prospect = {
  id: string;
  farm_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

type NetworkPartner = {
  id: string;
  full_name: string;
  business_name: string | null;
  referral_code: string;
  status: string;
  joined_at: string;
  customerCount: number;
  earnings: number;
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
  | "prospects"
  | "network"
  | "earnings";

export default function POGPPage() {
  const router = useRouter();

  const [partner, setPartner] =
    useState<Partner | null>(null);

  const [summary, setSummary] =
    useState<Summary>({
      totalCustomers: 0,
      activeCustomers: 0,
      totalProspects: 0,
      totalEarned: 0,
      paidCommission: 0,
      pendingCommission: 0,
      networkPartners: 0,
      networkCustomers: 0,
      networkCommissionTotal: 0,
    });

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [prospects, setProspects] =
    useState<Prospect[]>([]);

  const [network, setNetwork] =
    useState<NetworkPartner[]>([]);

  const [earnings, setEarnings] =
    useState<Commission[]>([]);

  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileOpen, setMobileOpen] =
    useState(false);

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

      const response =
        await fetch("/api/pogp", {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        });

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load your portal"
        );
      }

      setPartner(data.partner);

      setSummary({
        totalCustomers:
          data.summary?.totalCustomers || 0,
        activeCustomers:
          data.summary?.activeCustomers || 0,
        totalProspects:
          data.summary?.totalProspects || 0,
        totalEarned:
          data.summary?.totalEarned || 0,
        paidCommission:
          data.summary?.paidCommission || 0,
        pendingCommission:
          data.summary?.pendingCommission || 0,
        networkPartners:
          data.summary?.networkPartners || 0,
        networkCustomers:
          data.summary?.networkCustomers || 0,
        networkCommissionTotal:
          data.summary?.networkCommissionTotal || 0,
      });

      setCustomers(
        data.customers || []
      );

      setProspects(
        data.prospects || []
      );

      setNetwork(
        data.network || []
      );

      setEarnings(
        data.earnings || []
      );
    } catch (err) {
      console.error(
        "POGP portal error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your portal"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  }

  function formatDate(value: string) {
    if (!value) return "—";

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  }

  function commissionLabel(type: string) {
    switch (type) {
      case "new_customer":
        return "New customer";

      case "renewal":
        return "Renewal";

      case "network_renewal":
        return "Network renewal";

      default:
        return type
          .replaceAll("_", " ")
          .replace(
            /\b\w/g,
            (char) =>
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
      .split(/\s+/)[0] ||
    "Partner";

  const initials =
    partner?.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "PO";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#09295c] shadow-lg">
            <Handshake className="h-7 w-7 text-[#f5b942]" />
          </div>

          <div className="text-sm font-medium text-slate-500">
            Loading your partner portal...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] flex items-center justify-center p-6">
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
      id: "prospects" as Section,
      label: "My Prospects",
      icon: Target,
    },
    {
      id: "network" as Section,
      label: "My Network",
      icon: Network,
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
        : activeSection === "prospects"
          ? "My Prospects"
          : activeSection === "network"
            ? "My Network"
            : "My Earnings";

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#0b1f3a]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(false)
          }
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
        {/* Brand */}
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
                Growth Partner Portal
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              className="ml-auto rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
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
                    "Growth Partner"}
                </p>

                <p className="mt-0.5 text-xs text-white/55">
                  {partner?.pogp_code}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f5b942]/10 px-3 py-2 text-xs font-semibold text-[#f5c75d]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Growth Partner
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-7 flex-1 px-4">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            Partner Workspace
          </p>

          <div className="space-y-1.5">
            {navigation.map(
              (item) => {
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

                    <span>
                      {item.label}
                    </span>

                    {item.id ===
                      "customers" &&
                      summary.totalCustomers >
                        0 && (
                        <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                          {summary.totalCustomers}
                        </span>
                      )}
                  </button>
                );
              }
            )}
          </div>

          {/* Referral card */}
          <div className="mt-8 rounded-2xl border border-[#f5b942]/35 bg-gradient-to-br from-[#0d3269] to-[#092653] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5b942]/15">
              <TrendingUp className="h-5 w-5 text-[#f5c75d]" />
            </div>

            <p className="mt-4 text-sm font-bold text-white">
              Grow your earnings
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Refer customers and grow your partner network with PoultryOps.
            </p>

            <button
              type="button"
              onClick={() =>
                selectSection("customers")
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5b942] px-3 py-2.5 text-xs font-bold text-[#092653] transition hover:bg-[#ffd064]"
            >
              View Customers
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>

        {/* Sign out */}
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

      {/* Main content */}
      <div className="min-h-screen lg:pl-[280px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-5 sm:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#092653] shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  aria-label="Toggle sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b57d0]">
                  PoultryOps
                </p>

                <p className="text-sm font-semibold text-[#0b1f3a]">
                  POGP Portal
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

                {summary.pendingCommission >
                  0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f5b942] ring-2 ring-white" />
                )}
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#092653] text-xs font-bold text-[#f5c75d]">
                  {initials}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-[#0b1f3a]">
                    {partner?.full_name ||
                      "Growth Partner"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    {partner?.pogp_code}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          {/* Page heading */}
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f5b942]" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b57d0]">
                    Growth Partner Portal
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[#081f46] sm:text-4xl">
                  {pageTitle}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {activeSection ===
                  "overview"
                    ? "Your partner activity, customer growth and earnings at a glance."
                    : activeSection ===
                        "customers"
                      ? "Keep track of the customers you have brought to PoultryOps."
                      : activeSection ===
                          "prospects"
                        ? "Manage the businesses you are following up and converting."
                        : activeSection ===
                            "network"
                          ? "See the referral partners you have brought into your network."
                          : "A transparent view of your PoultryOps commission history and earnings."}
                </p>
              </div>

              {activeSection ===
                "overview" && (
                <div className="flex items-center gap-3">
                  <div className="hidden rounded-2xl border border-[#f0d28a] bg-[#fffaf0] px-4 py-3 sm:flex sm:items-center sm:gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5b942]/15">
                      <Handshake className="h-5 w-5 text-[#b77b00]" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b6a00]">
                        Partner Status
                      </p>

                      <p className="text-sm font-bold text-[#704c00]">
                        Active Partner
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Overview */}
          {activeSection ===
            "overview" && (
            <>
              {/* KPI cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Customers"
                  value={
                    summary.totalCustomers
                  }
                  subtitle={`${summary.activeCustomers} active`}
                  icon={Users}
                  iconClass="bg-blue-50 text-blue-600"
                  accent="blue"
                  onClick={() =>
                    selectSection(
                      "customers"
                    )
                  }
                />

                <MetricCard
                  label="Prospects"
                  value={
                    summary.totalProspects
                  }
                  subtitle="Businesses in your pipeline"
                  icon={Target}
                  iconClass="bg-emerald-50 text-emerald-600"
                  accent="green"
                  onClick={() =>
                    selectSection(
                      "prospects"
                    )
                  }
                />

                <MetricCard
                  label="Total Earned"
                  value={formatMoney(
                    summary.totalEarned
                  )}
                  subtitle={`${formatMoney(summary.paidCommission)} paid`}
                  icon={CircleDollarSign}
                  iconClass="bg-violet-50 text-violet-600"
                  accent="purple"
                  onClick={() =>
                    selectSection(
                      "earnings"
                    )
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
                    selectSection(
                      "earnings"
                    )
                  }
                />
              </div>

              {/* Main dashboard row */}
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                {/* Earnings overview */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                  <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#081f46]">
                          Earnings Overview
                        </h2>

                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                          i
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        Your commission performance
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      All time
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-8 md:grid-cols-[1fr_210px] md:items-center">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Total earned
                        </p>

                        <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#081f46]">
                          {formatMoney(
                            summary.totalEarned
                          )}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            Growing
                          </span>

                          <span className="text-slate-400">
                            Keep building your network
                          </span>
                        </div>

                        <div className="mt-7 space-y-3">
                          <LegendRow
                            label="Paid"
                            value={formatMoney(
                              summary.paidCommission
                            )}
                            dotClass="bg-[#1769f5]"
                          />

                          <LegendRow
                            label="Pending"
                            value={formatMoney(
                              summary.pendingCommission
                            )}
                            dotClass="bg-[#f5b942]"
                          />

                          <LegendRow
                            label="Network"
                            value={formatMoney(
                              summary.networkCommissionTotal
                            )}
                            dotClass="bg-violet-500"
                          />
                        </div>
                      </div>

                      <EarningsRing
                        total={
                          summary.totalEarned
                        }
                        pending={
                          summary.pendingCommission
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectSection(
                          "earnings"
                        )
                      }
                      className="mt-7 flex items-center gap-2 text-xs font-bold text-[#0b57d0] transition hover:text-[#0849b5]"
                    >
                      View full earnings report
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Performance */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(8,31,70,0.05)]">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#081f46]">
                        Performance Summary
                      </h2>

                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                        i
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Your partner activity
                    </p>
                  </div>

                  <div className="p-6">
                    <PerformanceRow
                      icon={Users}
                      label="Active Customers"
                      value={
                        summary.activeCustomers
                      }
                      iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <PerformanceRow
                      icon={Handshake}
                      label="Network Partners"
                      value={
                        summary.networkPartners
                      }
                      iconClass="bg-blue-50 text-blue-600"
                    />

                    <PerformanceRow
                      icon={Network}
                      label="Network Customers"
                      value={
                        summary.networkCustomers
                      }
                      iconClass="bg-violet-50 text-violet-600"
                    />

                    <PerformanceRow
                      icon={CircleDollarSign}
                      label="Network Earnings"
                      value={formatMoney(
                        summary.networkCommissionTotal
                      )}
                      iconClass="bg-amber-50 text-amber-600"
                      last
                    />

                    <button
                      type="button"
                      onClick={() =>
                        selectSection(
                          "network"
                        )
                      }
                      className="mt-5 flex items-center gap-2 text-xs font-bold text-[#0b57d0]"
                    >
                      View network performance
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity + Network */}
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <EmptyOrRecentCard
                  title="Recent Earnings"
                  subtitle="Your latest commission activity"
                  icon={WalletCards}
                  empty={
                    earnings.length ===
                    0
                  }
                  emptyTitle="No earnings yet"
                  emptyText="When your first qualifying commission is recorded, it will appear here."
                  actionLabel="View all earnings"
                  onAction={() =>
                    selectSection(
                      "earnings"
                    )
                  }
                >
                  {earnings
                    .slice(0, 4)
                    .map(
                      (commission) => (
                        <div
                          key={
                            commission.id
                          }
                          className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
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
                </EmptyOrRecentCard>

                <EmptyOrRecentCard
                  title="My Network"
                  subtitle="Partners you have brought into PoultryOps"
                  icon={Network}
                  empty={
                    network.length ===
                    0
                  }
                  emptyTitle="Your network is ready to grow"
                  emptyText="Referral partners you recruit will appear here, together with the customers they generate."
                  actionLabel="View my network"
                  onAction={() =>
                    selectSection(
                      "network"
                    )
                  }
                >
                  {network
                    .slice(0, 4)
                    .map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#092653] text-xs font-bold text-[#f5c75d]">
                              {item.full_name
                                .split(
                                  /\s+/
                                )
                                .slice(
                                  0,
                                  2
                                )
                                .map(
                                  (part) =>
                                    part[0]
                                )
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#0b1f3a]">
                                {
                                  item.full_name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {
                                  item.customerCount
                                }{" "}
                                customers
                              </p>
                            </div>
                          </div>

                          <p className="text-sm font-bold text-[#0b1f3a]">
                            {formatMoney(
                              item.earnings
                            )}
                          </p>
                        </div>
                      )
                    )}
                </EmptyOrRecentCard>
              </div>

              {/* CTA */}
              <div className="relative mt-6 overflow-hidden rounded-3xl bg-[#082b62] shadow-[0_15px_40px_rgba(6,31,73,0.18)]">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#1769f5]/20 blur-2xl" />
                <div className="absolute -bottom-28 right-40 h-60 w-60 rounded-full bg-[#f5b942]/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-9">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f5b942]/30 bg-[#f5b942]/10">
                      <TrendingUp className="h-6 w-6 text-[#f5c75d]" />
                    </div>

                    <div>
                      <p className="text-lg font-bold text-white">
                        Grow your network. Increase your earnings.
                      </p>

                      <p className="mt-1 max-w-2xl text-sm leading-6 text-white/60">
                        Bring more poultry businesses to PoultryOps and build a strong referral network around your territory.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      selectSection(
                        "network"
                      )
                    }
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f5b942] px-5 py-3 text-sm font-bold text-[#082b62] shadow-lg transition hover:bg-[#ffd064]"
                  >
                    Explore My Network
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Customers */}
          {activeSection ===
            "customers" && (
            <DataTableCard
              title="Customers I Referred"
              subtitle="Customers attributed to your POGP account."
              empty={
                customers.length ===
                0
              }
              emptyTitle="No customers yet"
              emptyText="Customers you refer and successfully attribute to your partner account will appear here."
              icon={Users}
            >
              {customers.map(
                (customer) => (
                  <tr
                    key={
                      customer.id
                    }
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0b57d0]">
                          <Users className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold text-[#0b1f3a]">
                            {
                              customer.farmName
                            }
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
                )
              )}
            </DataTableCard>
          )}

          {/* Prospects */}
          {activeSection ===
            "prospects" && (
            <DataTableCard
              title="My Prospects"
              subtitle="Prospective poultry businesses you are following up."
              empty={
                prospects.length ===
                0
              }
              emptyTitle="Your prospect pipeline is empty"
              emptyText="Genuine prospects you are following up will appear here."
              icon={Target}
            >
              {prospects.map(
                (prospect) => (
                  <tr
                    key={
                      prospect.id
                    }
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Target className="h-4 w-4" />
                        </div>

                        <p className="font-semibold text-[#0b1f3a]">
                          {
                            prospect.farm_name
                          }
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {prospect.contact_name ||
                        prospect.phone ||
                        prospect.email ||
                        "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                        {
                          prospect.status
                        }
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(
                        prospect.created_at
                      )}
                    </td>
                  </tr>
                )
              )}
            </DataTableCard>
          )}

          {/* Network */}
          {activeSection ===
            "network" && (
            <DataTableCard
              title="My Referral Network"
              subtitle="Partners you recruited and the activity generated through your network."
              empty={
                network.length ===
                0
              }
              emptyTitle="No network partners yet"
              emptyText="When you recruit referral partners, they will appear here along with the customers and earnings generated through your network."
              icon={Network}
            >
              {network.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#092653] text-xs font-bold text-[#f5c75d]">
                          {item.full_name
                            .split(
                              /\s+/
                            )
                            .slice(
                              0,
                              2
                            )
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-[#0b1f3a]">
                            {
                              item.full_name
                            }
                          </p>

                          {item.business_name && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                item.business_name
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {
                        item.referral_code
                      }
                    </td>

                    <td className="px-6 py-4 font-semibold text-[#0b1f3a]">
                      {
                        item.customerCount
                      }
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-[#0b1f3a]">
                      {formatMoney(
                        item.earnings
                      )}
                    </td>
                  </tr>
                )
              )}
            </DataTableCard>
          )}

          {/* Earnings */}
          {activeSection ===
            "earnings" && (
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
                    Your recorded PoultryOps commissions.
                  </p>
                </div>

                {earnings.length ===
                0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0b57d0]">
                      <WalletCards className="h-6 w-6" />
                    </div>

                    <p className="mt-5 text-sm font-bold text-[#0b1f3a]">
                      No commission records yet
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
                      Your commission history will appear here as qualifying customer and network payments are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
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

                          <th className="px-6 py-3.5 text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {earnings.map(
                          (
                            commission
                          ) => (
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
/* Reusable UI components                                                      */
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
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_8px_25px_rgba(8,31,70,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(8,31,70,0.09)] ${
        onClick
          ? "cursor-pointer"
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

function LegendRow({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: string;
  dotClass: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-slate-500">
        <span
          className={`h-2 w-2 rounded-full ${dotClass}`}
        />
        {label}
      </div>

      <span className="font-semibold text-[#0b1f3a]">
        {value}
      </span>
    </div>
  );
}

function EarningsRing({
  total,
  pending,
}: {
  total: number;
  pending: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((total - pending) /
              total) *
              100
          )
        )
      : 0;

  const radius = 76;
  const circumference =
    2 * Math.PI * radius;

  const dashOffset =
    circumference -
    (percentage / 100) *
      circumference;

  return (
    <div className="flex justify-center">
      <div className="relative h-[190px] w-[190px]">
        <svg
          viewBox="0 0 190 190"
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="95"
            cy="95"
            r={radius}
            fill="none"
            stroke="#eef2f7"
            strokeWidth="15"
          />

          <circle
            cx="95"
            cy="95"
            r={radius}
            fill="none"
            stroke="#1769f5"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              dashOffset
            }
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </p>

          <p className="mt-1 text-lg font-extrabold text-[#081f46]">
            {formatRingMoney(
              total
            )}
          </p>

          <p className="mt-1 text-[10px] font-medium text-slate-400">
            {Math.round(
              percentage
            )}
            % paid
          </p>
        </div>
      </div>
    </div>
  );
}

function formatRingMoney(
  value: number
) {
  if (value >= 1000000) {
    return `₦${(
      value / 1000000
    ).toFixed(1)}m`;
  }

  if (value >= 1000) {
    return `₦${Math.round(
      value / 1000
    )}k`;
  }

  return `₦${value.toLocaleString(
    "en-NG"
  )}`;
}

function PerformanceRow({
  icon: Icon,
  label,
  value,
  iconClass,
  last = false,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
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

function EmptyOrRecentCard({
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {title ===
                "Customers I Referred" && (
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
              )}

              {title ===
                "My Prospects" && (
                <tr>
                  <th className="px-6 py-3.5">
                    Farm
                  </th>
                  <th className="px-6 py-3.5">
                    Contact
                  </th>
                  <th className="px-6 py-3.5">
                    Status
                  </th>
                  <th className="px-6 py-3.5">
                    Added
                  </th>
                </tr>
              )}

              {title ===
                "My Referral Network" && (
                <tr>
                  <th className="px-6 py-3.5">
                    Partner
                  </th>
                  <th className="px-6 py-3.5">
                    Code
                  </th>
                  <th className="px-6 py-3.5">
                    Customers
                  </th>
                  <th className="px-6 py-3.5">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    Earnings
                  </th>
                </tr>
              )}
            </thead>

            <tbody>
              {children}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}