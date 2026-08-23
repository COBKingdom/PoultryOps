"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Customer = {
  farm_id: string;
  farm_name: string | null;
  farm_type: string | null;
  currency: string | null;
  owner_email: string | null;
  owner_name: string | null;
  user_count: number | null;
  plan: string | null;
  subscription_status: string | null;
  trial_start: string | null;
  trial_end: string | null;
  next_billing_date: string | null;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  customer_since: string | null;
};

type Activity = {
  type: string;
  event: string;
  email?: string;
  userId?: string;
  timestamp: string;
  amount?: number;
  farmId?: string;
  reference?: string;
};

type OverviewResponse = {
  success: boolean;
  summary?: {
    totalCustomers: number;
    totalUsers: number;
    newTrials: number;
    activeTrials: number;
    expiringTrials: number;
    expiredTrials: number;
    activeSubscribers: number;
    revenue: number;
  };
  customers?: Customer[];
  recentActivity?: Activity[];
  error?: string;
};

type Mode =
  | "new-trials"
  | "active-trials"
  | "expiring-trials"
  | "expired-trials"
  | "subscribers"
  | "revenue";

const CONFIG: Record<
  Mode,
  {
    title: string;
    subtitle: string;
    eyebrow: string;
  }
> = {
  "new-trials": {
    title: "New Trials",
    subtitle: "Recently started PoultryOps trials.",
    eyebrow: "TRIAL ACQUISITION",
  },
  "active-trials": {
    title: "Active Trials",
    subtitle: "Customers currently evaluating PoultryOps.",
    eyebrow: "TRIAL PIPELINE",
  },
  "expiring-trials": {
    title: "Expiring Trials",
    subtitle: "Trials approaching their expiry date.",
    eyebrow: "ATTENTION REQUIRED",
  },
  "expired-trials": {
    title: "Expired Trials",
    subtitle: "Trials that have reached their expiry date.",
    eyebrow: "TRIAL RECOVERY",
  },
  subscribers: {
    title: "Subscribers",
    subtitle: "Customers currently on a paid subscription.",
    eyebrow: "REVENUE ACCOUNTS",
  },
  revenue: {
    title: "Recorded Revenue",
    subtitle: "Successful payments recorded by PoultryOps.",
    eyebrow: "REVENUE",
  },
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(
  amount: number | null | undefined,
  currency = "NGN"
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function daysUntil(value: string | null | undefined) {
  if (!value) return null;

  const diff = new Date(value).getTime() - Date.now();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusClasses(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "trial":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "expired":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

export default function KpiDrilldownPage({
  mode,
}: {
  mode: Mode;
}) {
  const router = useRouter();

  const config = CONFIG[mode];

  const [data, setData] =
    useState<OverviewResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  async function loadData() {
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

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "Unable to load admin data."
        );
        return;
      }

      setData(result);
    } catch (err) {
      console.error(
        "Admin drill-down loading error:",
        err
      );

      setError(
        "Unable to load this administration view."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const customers = data?.customers || [];

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = [...customers];

    if (mode === "new-trials") {
      result = result.filter((customer) => {
        if (
          customer.subscription_status !==
          "trial"
        ) {
          return false;
        }

        const start =
          customer.trial_start ||
          customer.customer_since;

        if (!start) return false;

        const age =
          (Date.now() -
            new Date(start).getTime()) /
          (1000 * 60 * 60 * 24);

        return age <= 7 && age >= 0;
      });
    }

    if (mode === "active-trials") {
      result = result.filter(
        (customer) =>
          customer.subscription_status ===
            "trial" &&
          !!customer.trial_end &&
          new Date(
            customer.trial_end
          ).getTime() >= Date.now()
      );
    }

    if (mode === "expiring-trials") {
      result = result.filter((customer) => {
        if (
          customer.subscription_status !==
          "trial"
        ) {
          return false;
        }

        const days =
          daysUntil(customer.trial_end);

        return (
          days !== null &&
          days >= 0 &&
          days <= 3
        );
      });
    }

    if (mode === "expired-trials") {
      result = result.filter((customer) => {
        if (!customer.trial_end) {
          return false;
        }

        return (
          new Date(
            customer.trial_end
          ).getTime() < Date.now()
        );
      });
    }

    if (mode === "subscribers") {
      result = result.filter(
        (customer) =>
          customer.subscription_status ===
          "active"
      );
    }

    if (query) {
      result = result.filter(
        (customer) =>
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
            .includes(query)
      );
    }

    return result;
  }, [
    customers,
    mode,
    search,
  ]);

  const revenueEvents = useMemo(() => {
    const events =
      data?.recentActivity || [];

    const result = events.filter(
      (event) =>
        event.type === "payment" &&
        event.event === "successful" &&
        (event.amount || 0) > 0
    );

    if (!search.trim()) {
      return result;
    }

    const query =
      search.toLowerCase();

    return result.filter(
      (event) =>
        event.email
          ?.toLowerCase()
          .includes(query) ||
        event.reference
          ?.toLowerCase()
          .includes(query)
    );
  }, [
    data?.recentActivity,
    search,
  ]);

  const displayedCount =
    mode === "revenue"
      ? revenueEvents.length
      : filteredCustomers.length;

  const displayedRevenue =
    revenueEvents.reduce(
      (total, event) =>
        total + (event.amount || 0),
      0
    );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-4 w-96 rounded bg-slate-200" />
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
          <div className="h-96 rounded-2xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() =>
              router.push("/admin")
            }
            className="mb-6 text-sm text-slate-500 hover:text-slate-900"
          >
            ? Admin Control Centre
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-red-600">
              ADMINISTRATION ERROR
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Unable to load data
            </h1>

            <p className="mt-2 text-slate-500">
              {error}
            </p>

            <button
              onClick={loadData}
              className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center justify-between">
          <div>

            <button
              onClick={() =>
                router.push("/admin")
              }
              className="mb-4 text-sm text-slate-500 hover:text-slate-900"
            >
              ? Admin Control Centre
            </button>

            <div className="text-xs font-semibold tracking-[0.25em] text-slate-500">
              POULTRYOPS
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {config.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {config.subtitle}
            </p>

          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh data
          </button>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-wider text-slate-400">
              {config.eyebrow}
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-950">
              {displayedCount}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Records currently matching this view
            </div>
          </div>

          {mode === "revenue" ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold tracking-wider text-slate-400">
                  DISPLAYED REVENUE
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-950">
                  {formatMoney(
                    displayedRevenue
                  )}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Successful payments in the current activity feed
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold tracking-wider text-slate-400">
                  TOTAL RECORDED
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-950">
                  {formatMoney(
                    data?.summary?.revenue ||
                      0
                  )}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Platform recorded revenue
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold tracking-wider text-slate-400">
                  TOTAL CUSTOMERS
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-950">
                  {data?.summary?.totalCustomers ||
                    0}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Registered PoultryOps farms
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold tracking-wider text-slate-400">
                  PLATFORM USERS
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-950">
                  {data?.summary?.totalUsers ||
                    0}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Accounts across the platform
                </div>
              </div>
            </>
          )}

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {mode === "revenue"
                  ? "Payment History"
                  : "Customer Directory"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {mode === "revenue"
                  ? "Successful payments currently recorded by PoultryOps."
                  : "Customers matching the selected administration view."}
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                mode === "revenue"
                  ? "Search email or reference..."
                  : "Search farms or owners..."
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 md:w-72"
            />

          </div>

          {mode === "revenue" ? (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Payment
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Amount
                    </th>

                    <th className="px-5 py-4">
                      Reference
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {revenueEvents.map(
                    (event, index) => {

                      const customer =
                        customers.find(
                          (item) =>
                            item.farm_id ===
                            event.farmId
                        );

                      return (
                        <tr
                          key={`${event.timestamp}-${index}`}
                          onClick={() =>
                            customer &&
                            router.push(
                              `/admin/customers/${customer.farm_id}`
                            )
                          }
                          className={`hover:bg-slate-50 ${
                            customer
                              ? "cursor-pointer"
                              : ""
                          }`}
                        >

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              Payment Received
                            </div>

                            <div className="text-xs text-slate-500">
                              {customer?.farm_name ||
                                "Farm payment"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {event.email ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-900">
                            {formatMoney(
                              event.amount
                            )}
                          </td>

                          <td className="px-5 py-4 font-mono text-xs text-slate-500">
                            {event.reference ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDateTime(
                              event.timestamp
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>

                    <th className="px-5 py-4">
                      Farm
                    </th>

                    <th className="px-5 py-4">
                      Owner
                    </th>

                    <th className="px-5 py-4">
                      Plan
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Users
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredCustomers.map(
                    (customer) => {

                      const days =
                        daysUntil(
                          customer.trial_end
                        );

                      return (
                        <tr
                          key={customer.farm_id}
                          onClick={() =>
                            router.push(
                              `/admin/customers/${customer.farm_id}`
                            )
                          }
                          className="cursor-pointer hover:bg-slate-50"
                        >

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {customer.farm_name ||
                                "Unnamed farm"}
                            </div>

                            <div className="text-xs text-slate-500">
                              {customer.farm_type ||
                                "Poultry"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-800">
                              {customer.owner_email ||
                                "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm capitalize text-slate-700">
                            {customer.plan ||
                              "Trial"}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                                customer.subscription_status
                              )}`}
                            >
                              {customer.subscription_status ||
                                "Unknown"}
                            </span>

                            {mode.includes(
                              "trial"
                            ) &&
                              days !== null && (
                                <div className="mt-1 text-xs text-slate-400">
                                  {days >= 0
                                    ? `${days} days remaining`
                                    : `${Math.abs(
                                        days
                                      )} days overdue`}
                                </div>
                              )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {customer.user_count ??
                              0}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {mode ===
                            "subscribers"
                              ? formatDate(
                                  customer.next_billing_date
                                )
                              : formatDate(
                                  customer.trial_end ||
                                    customer.customer_since
                                )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

          {displayedCount === 0 && (
            <div className="p-12 text-center">

              <div className="text-sm font-semibold text-slate-900">
                No records found
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Nothing currently matches this administration view.
              </div>

            </div>
          )}

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            Showing {displayedCount} record
            {displayedCount === 1
              ? ""
              : "s"}.
          </div>

        </section>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">

          <span className="font-semibold text-slate-700">
            PoultryOps Platform Administration
          </span>

          <span className="float-right">
            Data is read directly from the existing platform systems.
          </span>

        </div>

      </div>
    </main>
  );
}
