"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type Customer = {
  farm_id: string;
  farm_code: string | null;
  farm_name: string | null;
  farm_type: string | null;
  currency: string | null;
  active: boolean | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  user_count: number | null;
  plan: string | null;
  subscription_status: string | null;
  billing_cycle: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  customer_since: string | null;
  days_remaining: string | null;
};

type Activity = {
  type: string;
  event: string;
  email?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  amount?: number;
  farmId?: string;
  reference?: string;
};

type Summary = {
  totalCustomers: number;
  totalUsers: number;
  newTrials: number;
  activeTrials: number;
  expiringTrials: number;
  expiredTrials: number;
  activeSubscribers: number;
  revenue: number;
  failedPayments: number;
};

type OverviewResponse = {
  success: boolean;
  summary?: Summary;
  recentActivity?: Activity[];
  customers?: Customer[];
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNaira(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return `₦${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function statusLabel(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Active";
    case "trial":
      return "Trial";
    case "expired":
      return "Expired";
    case "suspended":
      return "Suspended";
    default:
      return status || "Unknown";
  }
}

function statusClasses(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "trial":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "expired":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "suspended":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-500/20";
  }
}

function PaymentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ActivityFallbackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

function activityIcon(type: string) {
  if (type === "payment") {
    return <PaymentIcon />;
  }

  if (type === "email") {
    return <EmailIcon />;
  }

  return <ActivityFallbackIcon />;
}

function activityTitle(activity: Activity) {
  if (activity.type === "payment") {
    return activity.event === "successful"
      ? "Payment received"
      : `Payment ${activity.event}`;
  }

  switch (activity.event) {
    case "welcome":
      return "Welcome email sent";
    case "subscription_activated":
      return "Subscription activated";
    case "subscription_renewed":
      return "Subscription renewed";
    case "payment_received":
      return "Payment confirmation sent";
    case "trial_1_day":
      return "Trial approaching expiry";
    case "trial_3_days":
      return "Trial expiry reminder";
    case "trial_expired":
      return "Trial expired";
    default:
      return activity.event.replaceAll("_", " ");
  }
}

export default function AdminOverviewPage() {
  const router = useRouter();

  const [data, setData] =
    useState<OverviewResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/overview",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result: OverviewResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.error ||
            "Unable to load admin overview."
        );
        return;
      }

      setData(result);
    } catch (err) {
      console.error(
        "Admin overview loading error:",
        err
      );

      setError(
        "Unable to load the Admin Control Centre."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredCustomers =
    useMemo(() => {
      const customers =
        data?.customers || [];

      const query =
        search.trim().toLowerCase();

      return customers.filter(
        (customer) => {
          const matchesSearch =
            !query ||
            customer.farm_name
              ?.toLowerCase()
              .includes(query) ||
            customer.owner_email
              ?.toLowerCase()
              .includes(query) ||
            customer.owner_name
              ?.toLowerCase()
              .includes(query) ||
            customer.plan
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            (
              customer.subscription_status ||
              ""
            ).toLowerCase() ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      data?.customers,
      search,
      statusFilter,
    ]);

  const summary = data?.summary;

  if (loading) {
    return (
      <AppShell>
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-10 w-80 rounded-lg bg-slate-200" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 rounded-xl bg-white shadow-sm"
                  />
                ))}
              </div>

              <div className="h-96 rounded-xl bg-white shadow-sm" />
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
              <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
                Admin Control Centre
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Unable to load overview
              </h1>

              <p className="mt-3 text-slate-600">
                {error}
              </p>

              <button
                onClick={loadOverview}
                className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Header */}
          <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                PoultryOps
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Admin Control Centre
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Central visibility of customers, trials,
                subscriptions, payments and account activity.
              </p>
            </div>

            <button
              onClick={loadOverview}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh data
            </button>
          </header>

          {/* KPI cards */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <KpiCard
              label="Customers"
              value={
                summary?.totalCustomers ?? 0
              }
              detail="Registered farms"
              onClick={() => {
                document
                  .getElementById(
                    "customer-overview"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
            />

            <KpiCard
              label="Users"
              value={
                summary?.totalUsers ?? 0
              }
              detail="Platform users"
              onClick={() =>
                router.push(
                  "/admin/users"
                )
              }
            />

            <KpiCard
              label="New Trials"
              value={
                summary?.newTrials ?? 0
              }
              detail="Recent trial starts"
              accent="blue"
              onClick={() =>
                router.push(
                  "/admin/new"
                )
              }
            />

            <KpiCard
              label="Active Trials"
              value={
                summary?.activeTrials ?? 0
              }
              detail="Currently trialling"
              accent="blue"
              onClick={() =>
                router.push(
                  "/admin/active"
                )
              }
            />

            <KpiCard
              label="Expiring Trials"
              value={
                summary?.expiringTrials ?? 0
              }
              detail="Needs attention"
              accent="amber"
              onClick={() =>
                router.push(
                  "/admin/expiring"
                )
              }
            />

            <KpiCard
              label="Expired Trials"
              value={
                summary?.expiredTrials ?? 0
              }
              detail="Trial ended"
              accent="red"
              onClick={() =>
                router.push(
                  "/admin/expired"
                )
              }
            />

            <KpiCard
              label="Subscribers"
              value={
                summary?.activeSubscribers ?? 0
              }
              detail="Active paid accounts"
              accent="green"
              onClick={() =>
                router.push(
                  "/admin/subscribers"
                )
              }
            />

            <KpiCard
              label="Recorded Revenue"
              value={formatNaira(
                summary?.revenue ?? 0
              )}
              detail="Recorded payments"
              accent="green"
              onClick={() =>
                router.push(
                  "/admin/revenue"
                )
              }
            />
          </section>

          {/* Main grid */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

            {/* Customers */}
            <section
              id="customer-overview"
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Customer Overview
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      All farms currently known to PoultryOps.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search customers..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:w-56"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="all">
                        All statuses
                      </option>

                      <option value="trial">
                        Trial
                      </option>

                      <option value="active">
                        Active
                      </option>

                      <option value="expired">
                        Expired
                      </option>

                      <option value="suspended">
                        Suspended
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Farm
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Owner
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Users
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plan
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={
                            customer.farm_id
                          }
                          onClick={() =>
                            router.push(
                              `/admin/customers/${customer.farm_id}`
                            )
                          }
                          className="cursor-pointer hover:bg-slate-50"
                          title={`Open ${
                            customer.farm_name ||
                            "customer"
                          } details`}
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {customer.farm_name ||
                                "Unnamed farm"}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-500">
                              {customer.farm_type ||
                                "Poultry"}

                              {customer.currency
                                ? ` • ${customer.currency}`
                                : ""}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-slate-800">
                              {customer.owner_name ||
                                "Name not provided"}
                            </div>

                            <div className="text-xs text-slate-500">
                              {customer.owner_email ||
                                "Email not available"}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {customer.user_count ??
                              0}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-medium capitalize text-slate-700">
                            {customer.plan ||
                              "Trial"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                                customer.subscription_status
                              )}`}
                            >
                              {statusLabel(
                                customer.subscription_status
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                            {customer.subscription_status ===
                            "trial"
                              ? formatDate(
                                  customer.trial_end
                                )
                              : formatDate(
                                  customer.next_billing_date
                                )}
                          </td>
                        </tr>
                      )
                    )}

                    {filteredCustomers.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center text-sm text-slate-500"
                        >
                          No customers match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                Showing{" "}
                {filteredCustomers.length}{" "}
                of{" "}
                {data?.customers?.length ||
                  0}{" "}
                customers
              </div>
            </section>

            {/* Activity */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest customer and payment events.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {(data?.recentActivity ||
                  []).map(
                    (activity, index) => (
                      <div
                        key={`${activity.timestamp}-${index}`}
                        className="p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                            {activityIcon(
                              activity.type
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold capitalize text-slate-900">
                              {activityTitle(
                                activity
                              )}
                            </div>

                            {activity.email && (
                              <div className="mt-0.5 truncate text-xs text-slate-500">
                                {activity.email}
                              </div>
                            )}

                            {activity.amount !==
                              undefined && (
                              <div className="mt-1 text-sm font-semibold text-slate-700">
                                {formatNaira(
                                  activity.amount
                                )}
                              </div>
                            )}

                            {activity.reference && (
                              <div className="mt-0.5 truncate text-xs text-slate-400">
                                {
                                  activity.reference
                                }
                              </div>
                            )}

                            <div className="mt-1 text-xs text-slate-400">
                              {formatDateTime(
                                activity.timestamp
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                {(data?.recentActivity ||
                  []).length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No recent activity.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* System note */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Platform status
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Admin data is read directly from the existing PoultryOps
                  systems. No customer subscription or account state is
                  modified by this dashboard.
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  detail,
  accent = "slate",
  onClick,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?:
    | "slate"
    | "blue"
    | "amber"
    | "red"
    | "green";
  onClick?: () => void;
}) {
  const accents = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">
            {label}
          </div>

          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {detail}
          </div>
        </div>

        <div
          className={`h-3 w-3 rounded-full ${accents[accent]}`}
        />
      </div>
    </div>
  );
}