"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CustomerResponse = {
  success: boolean;
  error?: string;
  customer?: {
    farm: {
      id: string;
      farm_code: string | null;
      name: string;
      farm_type: string | null;
      currency: string | null;
      active: boolean;
      owner_id: string;
      created_at: string;
    };
    owner: {
      id: string;
      email: string | null;
      full_name: string | null;
      role: string | null;
      status: string | null;
      created_at: string | null;
      last_sign_in_at: string | null;
      must_change_password: boolean | null;
    } | null;
    users: Array<{
      id: string;
      user_id: string;
      role: string | null;
      status: string;
      created_at: string;
      invited_by: string | null;
      joined_at: string | null;
      profile: {
        id: string;
        email: string | null;
        full_name: string | null;
        role: string | null;
        status: string | null;
        created_at: string | null;
        last_sign_in_at: string | null;
        must_change_password: boolean | null;
      } | null;
    }>;
    subscription: {
      id: string;
      farm_id: string;
      plan: string | null;
      selected_plan: string | null;
      status: string | null;
      billing_cycle: string | null;
      trial_start: string | null;
      trial_end: string | null;
      next_billing_date: string | null;
      amount_paid: number | null;
      payment_reference: string | null;
      transaction_id: string | null;
      created_at: string | null;
    } | null;
    payments: Array<{
      id: string;
      farm_id: string;
      plan: string | null;
      billing_cycle: string | null;
      amount_paid: number | null;
      transaction_id: string | null;
      payment_reference: string | null;
      status: string | null;
      paid_at: string | null;
      created_at: string | null;
    }>;
    auditLogs: Array<{
      id: string;
      user_id: string | null;
      action: string | null;
      resource_type: string | null;
      resource_id: string | null;
      old_values: unknown;
      new_values: unknown;
      metadata: unknown;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
    }>;
    emailEvents: Array<{
      id: string;
      user_id: string | null;
      event_type: string | null;
      email: string | null;
      sent_at: string | null;
      metadata: unknown;
    }>;
    metrics: {
      userCount: number;
      paymentCount: number;
      totalPayments: number;
      auditEventCount: number;
      emailEventCount: number;
    };
  };
};

const tabs = [
  "Overview",
  "Users",
  "Subscription",
  "Payments",
  "Activity",
] as const;

type Tab = (typeof tabs)[number];

function displayValue(value?: string | null) {
  return value || "Not provided";
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function titleCase(value?: string | null) {
  if (!value) return "Not provided";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const authKey = Object.keys(localStorage).find((key) =>
    key.endsWith("-auth-token")
  );

  if (!authKey) return null;

  const raw = localStorage.getItem(authKey);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function StatusBadge({
  status,
  large = false,
}: {
  status?: string | null;
  large?: boolean;
}) {
  const normalized = status?.toLowerCase() || "unknown";

  let classes =
    "bg-slate-100 text-slate-700 border-slate-200";

  if (
    normalized === "active" ||
    normalized === "successful"
  ) {
    classes =
      "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    normalized === "trial" ||
    normalized === "pending"
  ) {
    classes =
      "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (
    normalized === "expired" ||
    normalized === "failed" ||
    normalized === "suspended"
  ) {
    classes =
      "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
        large ? "text-sm" : "text-xs"
      } ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {titleCase(status)}
    </span>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>

      <span
        className={`max-w-[60%] text-right text-sm font-medium text-slate-900 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value || "Not provided"}
      </span>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ farmId: string }>();
  const router = useRouter();

  const farmId = params?.farmId;

  const [data, setData] =
    useState<CustomerResponse["customer"] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] =
    useState<Tab>("Overview");

  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [showSuspendDialog, setShowSuspendDialog] =
    useState(false);

  const [showReactivateDialog, setShowReactivateDialog] =
    useState(false);

  const [showTrialDialog, setShowTrialDialog] =
    useState(false);

  const [confirmationName, setConfirmationName] =
    useState("");

  const [trialDays, setTrialDays] = useState("7");

  async function loadCustomer() {
    try {
      setLoading(true);
      setError("");

      const session = getAuthSession();

      if (!session?.access_token) {
        setError(
          "Your administrator session has expired. Please sign in again."
        );
        return;
      }

      const response = await fetch(
        `/api/admin/customers/${farmId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result: CustomerResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load customer"
        );
      }

      setData(result.customer || null);
    } catch (err) {
      console.error(
        "Customer detail loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customer"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (farmId) {
      loadCustomer();
    }
  }, [farmId]);

  const trialDaysRemaining = useMemo(() => {
    if (!data?.subscription?.trial_end) return null;

    const end = new Date(
      data.subscription.trial_end
    ).getTime();

    if (Number.isNaN(end)) return null;

    const now = Date.now();

    return Math.ceil(
      (end - now) / (1000 * 60 * 60 * 24)
    );
  }, [data?.subscription?.trial_end]);

  const totalPayments = useMemo(
    () =>
      (data?.payments || []).reduce(
        (sum, payment) =>
          sum + Number(payment.amount_paid || 0),
        0
      ),
    [data?.payments]
  );

  async function performAction(
    action:
      | "suspend"
      | "reactivate"
      | "extend_trial"
      | "delete",
    payload: Record<string, unknown> = {}
  ) {
    try {
      setActionLoading(action);
      setActionError("");
      setActionMessage("");

      const session = getAuthSession();

      if (!session?.access_token) {
        throw new Error(
          "Your administrator session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        `/api/admin/customers/${farmId}/manage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action,
            ...payload,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The requested action failed."
        );
      }

      if (action === "delete") {
        router.push("/admin");
        router.refresh();
        return;
      }

      setActionMessage(
        result.message || "Action completed successfully."
      );

      setShowSuspendDialog(false);
      setShowReactivateDialog(false);
      setShowTrialDialog(false);

      await loadCustomer();
    } catch (err) {
      console.error(
        `Admin customer action "${action}" failed:`,
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "The requested action failed."
      );
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-5 py-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="mt-5 h-10 w-80 rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6 h-96 rounded-2xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-5 py-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-6 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Back to Admin Control Centre
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              Customer workspace
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Unable to load customer
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {error || "Customer record was not found."}
            </p>

            <button
              type="button"
              onClick={loadCustomer}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const {
    farm,
    owner,
    users,
    subscription,
    payments,
    auditLogs,
    emailEvents,
    metrics,
  } = data;

  const status = !farm.active
    ? "suspended"
    : subscription?.status || "active";

  const plan =
    subscription?.status === "trial"
      ? subscription.selected_plan
      : subscription?.plan;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="group flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <span className="transition group-hover:-translate-x-0.5">
            ←
          </span>
          Admin Control Centre
        </button>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white shadow-sm">
                {farm.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">
                    {farm.name}
                  </h1>

                  <StatusBadge
                    status={status}
                    large
                  />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {owner?.email || "No owner email"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>
                    Customer since{" "}
                    <strong className="font-semibold text-slate-700">
                      {formatShortDate(farm.created_at)}
                    </strong>
                  </span>

                  <span className="hidden text-slate-300 sm:inline">
                    •
                  </span>

                  <span>
                    Farm ID{" "}
                    <strong className="font-mono font-medium text-slate-700">
                      {farm.id.slice(0, 8)}…
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  farm.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {farm.active ? "ACCOUNT ACTIVE" : "ACCOUNT SUSPENDED"}
              </span>

              <button
                type="button"
                onClick={loadCustomer}
                disabled={Boolean(actionLoading)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {actionError}
            </div>
          )}

          <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Plan
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {titleCase(plan)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {titleCase(subscription?.billing_cycle)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Trial remaining
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {trialDaysRemaining !== null
                  ? trialDaysRemaining > 0
                    ? `${trialDaysRemaining} days`
                    : "Expired"
                  : "Not available"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Ends {formatShortDate(subscription?.trial_end)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Users
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {metrics.userCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Active farm members
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Lifetime payments
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {farm.currency || "NGN"}{" "}
                {totalPayments.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {metrics.paymentCount} recorded payments
              </p>
            </div>
          </div>
        </div>

        {/* FARM MANAGEMENT */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Farm Management
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Platform-level controls for this customer account.
                  Subscription billing remains separate.
                </p>
              </div>

              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                ADMIN ONLY
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
            {farm.active ? (
              <button
                type="button"
                onClick={() => {
                  setActionError("");
                  setActionMessage("");
                  setShowSuspendDialog(true);
                }}
                disabled={Boolean(actionLoading)}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-50"
              >
                <p className="text-sm font-bold text-amber-900">
                  Suspend Customer
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Disable the customer account without changing its
                  subscription record.
                </p>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActionError("");
                  setActionMessage("");
                  setShowReactivateDialog(true);
                }}
                disabled={Boolean(actionLoading)}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
              >
                <p className="text-sm font-bold text-emerald-900">
                  Reactivate Customer
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  Restore the platform account without changing its
                  subscription record.
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActionError("");
                setActionMessage("");
                setShowTrialDialog(true);
              }}
              disabled={Boolean(actionLoading)}
              className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50"
            >
              <p className="text-sm font-bold text-blue-900">
                Extend Trial
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Add days to the existing trial end date.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionError("");
                setActionMessage("");
                setConfirmationName("");
                setShowDeleteDialog(true);
              }}
              disabled={Boolean(actionLoading)}
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-left transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
            >
              <p className="text-sm font-bold text-red-900">
                Delete Customer
              </p>
              <p className="mt-1 text-xs leading-5 text-red-800">
                Permanently remove the farm, customer data and Auth
                users.
              </p>
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-900">
                Subscription
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Current subscription status:
              </p>
              <div className="mt-3">
                <StatusBadge
                  status={subscription?.status}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Suspend/reactivate does not modify this status.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-max px-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-4 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}

                {activeTab === tab && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-slate-950" />
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Overview" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Section
              title="Account information"
              description="Core information about this customer account."
            >
              <DetailRow
                label="Farm name"
                value={farm.name}
              />
              <DetailRow
                label="Farm type"
                value={titleCase(farm.farm_type)}
              />
              <DetailRow
                label="Currency"
                value={farm.currency}
              />
              <DetailRow
                label="Account status"
                value={
                  <StatusBadge
                    status={
                      farm.active
                        ? "active"
                        : "suspended"
                    }
                  />
                }
              />
              <DetailRow
                label="Created"
                value={formatDate(farm.created_at)}
              />
              <DetailRow
                label="Farm ID"
                value={farm.id}
                mono
              />
            </Section>

            <Section
              title="Subscription health"
              description="Current subscription state from the existing billing system."
            >
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={subscription?.status}
                  />
                }
              />
              <DetailRow
                label="Plan"
                value={titleCase(plan)}
              />
              <DetailRow
                label="Billing cycle"
                value={titleCase(subscription?.billing_cycle)}
              />
              <DetailRow
                label="Trial started"
                value={formatDate(subscription?.trial_start)}
              />
              <DetailRow
                label="Trial ends"
                value={formatDate(subscription?.trial_end)}
              />
              <DetailRow
                label="Next billing"
                value={formatDate(subscription?.next_billing_date)}
              />
            </Section>

            <Section
              title="Account owner"
              description="Primary customer contact and account owner."
            >
              <DetailRow
                label="Name"
                value={owner?.full_name}
              />
              <DetailRow
                label="Email"
                value={owner?.email}
              />
              <DetailRow
                label="Role"
                value={titleCase(owner?.role)}
              />
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={owner?.status}
                  />
                }
              />
              <DetailRow
                label="Last sign-in"
                value={formatDate(owner?.last_sign_in_at)}
              />
              <DetailRow
                label="Password change required"
                value={
                  owner?.must_change_password
                    ? "Yes"
                    : "No"
                }
              />
            </Section>

            <Section
              title="Platform activity"
              description="Recorded activity associated with this customer."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-bold">
                    {metrics.userCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Users
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-bold">
                    {metrics.paymentCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Payments
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-bold">
                    {metrics.emailEventCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Emails
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-bold">
                    {metrics.auditEventCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Audit events
                  </p>
                </div>
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Users" && (
          <div className="mt-6">
            <Section
              title="Farm users"
              description={`${users.length} user${
                users.length === 1 ? "" : "s"
              } currently associated with this farm.`}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 font-semibold">
                        User
                      </th>
                      <th className="pb-3 font-semibold">
                        Role
                      </th>
                      <th className="pb-3 font-semibold">
                        Status
                      </th>
                      <th className="pb-3 font-semibold">
                        Joined
                      </th>
                      <th className="pb-3 font-semibold">
                        Last sign-in
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((membership) => (
                      <tr
                        key={membership.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {membership.profile
                              ?.full_name ||
                              "Name not provided"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {membership.profile?.email ||
                              "No email"}
                          </p>
                        </td>

                        <td className="py-4 text-sm text-slate-700">
                          {titleCase(membership.role)}
                        </td>

                        <td className="py-4">
                          <StatusBadge
                            status={membership.status}
                          />
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {formatShortDate(
                            membership.joined_at ||
                              membership.created_at
                          )}
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {formatDate(
                            membership.profile
                              ?.last_sign_in_at
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Subscription" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Section
              title="Subscription state"
              description="Read-only inspection of the existing subscription engine."
            >
              <DetailRow
                label="Current status"
                value={
                  <StatusBadge
                    status={subscription?.status}
                    large
                  />
                }
              />
              <DetailRow
                label="Selected plan"
                value={titleCase(subscription?.selected_plan)}
              />
              <DetailRow
                label="Active plan"
                value={titleCase(subscription?.plan)}
              />
              <DetailRow
                label="Billing cycle"
                value={titleCase(subscription?.billing_cycle)}
              />
              <DetailRow
                label="Trial start"
                value={formatDate(subscription?.trial_start)}
              />
              <DetailRow
                label="Trial end"
                value={formatDate(subscription?.trial_end)}
              />
              <DetailRow
                label="Next billing date"
                value={formatDate(subscription?.next_billing_date)}
              />
            </Section>

            <Section
              title="Subscription identifiers"
              description="Useful references for support and investigation."
            >
              <DetailRow
                label="Subscription ID"
                value={subscription?.id}
                mono
              />
              <DetailRow
                label="Farm ID"
                value={farm.id}
                mono
              />
              <DetailRow
                label="Payment reference"
                value={subscription?.payment_reference}
                mono
              />
              <DetailRow
                label="Transaction ID"
                value={subscription?.transaction_id}
                mono
              />
              <DetailRow
                label="Created"
                value={formatDate(subscription?.created_at)}
              />
            </Section>

            <div className="lg:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-950">
                Subscription engine protected
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                Platform suspension is separate from subscription
                billing. Suspending or reactivating this customer does
                not change the subscription status, payment history,
                plan, or Flutterwave records.
              </p>
            </div>
          </div>
        )}

        {activeTab === "Payments" && (
          <div className="mt-6">
            <Section
              title="Payment history"
              description={`${payments.length} recorded payment${
                payments.length === 1 ? "" : "s"
              } for this customer.`}
            >
              {payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No payments recorded
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    This customer has not yet made a recorded payment.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-3 font-semibold">
                          Date
                        </th>
                        <th className="pb-3 font-semibold">
                          Amount
                        </th>
                        <th className="pb-3 font-semibold">
                          Plan
                        </th>
                        <th className="pb-3 font-semibold">
                          Cycle
                        </th>
                        <th className="pb-3 font-semibold">
                          Status
                        </th>
                        <th className="pb-3 font-semibold">
                          Reference
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-4 text-sm text-slate-600">
                            {formatDate(
                              payment.paid_at ||
                                payment.created_at
                            )}
                          </td>

                          <td className="py-4 text-sm font-bold text-slate-950">
                            {farm.currency || "NGN"}{" "}
                            {Number(
                              payment.amount_paid || 0
                            ).toLocaleString()}
                          </td>

                          <td className="py-4 text-sm text-slate-700">
                            {titleCase(payment.plan)}
                          </td>

                          <td className="py-4 text-sm text-slate-700">
                            {titleCase(
                              payment.billing_cycle
                            )}
                          </td>

                          <td className="py-4">
                            <StatusBadge
                              status={payment.status}
                            />
                          </td>

                          <td className="py-4 font-mono text-xs text-slate-500">
                            {payment.payment_reference ||
                              payment.transaction_id ||
                              "Not provided"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Section
              title="Email activity"
              description="Email events recorded for this customer."
            >
              {emailEvents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No email events recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {emailEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-4 rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        @
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {titleCase(event.event_type)}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {event.email || "No email"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(event.sent_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Audit activity"
              description="Administrative and system events currently available for this customer."
            >
              {auditLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No audit events recorded
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    This is expected for some newly created accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {titleCase(event.action)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {titleCase(event.resource_type)}
                          </p>
                        </div>

                        <span className="whitespace-nowrap text-xs text-slate-400">
                          {formatDate(event.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        <div className="mt-6 flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>
            PoultryOps Platform Administration
          </span>

          <span>
            Customer management actions are restricted to Platform Administrators.
          </span>
        </div>
      </div>

      {/* SUSPEND CONFIRMATION */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">
              Suspend customer?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will mark{" "}
              <strong>{farm.name}</strong> as suspended at the
              platform level.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              The customer's subscription, payment history and
              billing status will not be changed.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSuspendDialog(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => performAction("suspend")}
                disabled={actionLoading === "suspend"}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === "suspend"
                  ? "Suspending..."
                  : "Suspend Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REACTIVATE CONFIRMATION */}
      {showReactivateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">
              Reactivate customer?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will restore{" "}
              <strong>{farm.name}</strong> to active platform
              status.
            </p>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              The existing subscription status remains unchanged.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowReactivateDialog(false)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  performAction("reactivate")
                }
                disabled={actionLoading === "reactivate"}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading === "reactivate"
                  ? "Reactivating..."
                  : "Reactivate Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL EXTENSION */}
      {showTrialDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">
              Extend trial
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Add additional days to the customer's trial.
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Number of days
              <input
                type="number"
                min="1"
                max="365"
                step="1"
                value={trialDays}
                onChange={(event) =>
                  setTrialDays(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
              />
            </label>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Current trial end:{" "}
              <strong>
                {formatDate(subscription?.trial_end)}
              </strong>
              <br />
              Only the trial end date will be changed.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTrialDialog(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  performAction("extend_trial", {
                    trialDays: Number(trialDays),
                  })
                }
                disabled={
                  actionLoading === "extend_trial"
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "extend_trial"
                  ? "Extending..."
                  : "Extend Trial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-900">
                Permanent deletion
              </p>

              <p className="mt-2 text-sm leading-6 text-red-800">
                This action permanently removes the customer's
                application data, farm, subscription/payment records,
                customer profiles and Supabase Auth users.
              </p>
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-950">
              Delete {farm.name}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This cannot be undone.
              <br />
              <br />
              To continue, type the exact farm name:
            </p>

            <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 font-mono text-sm font-bold text-slate-900">
              {farm.name}
            </p>

            <input
              type="text"
              value={confirmationName}
              onChange={(event) =>
                setConfirmationName(event.target.value)
              }
              placeholder="Type the exact farm name"
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-500"
            />

            {actionError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConfirmationName("");
                }}
                disabled={actionLoading === "delete"}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  performAction("delete", {
                    confirmationName,
                  })
                }
                disabled={
                  actionLoading === "delete" ||
                  confirmationName !== farm.name
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading === "delete"
                  ? "Deleting customer..."
                  : "Permanently Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}