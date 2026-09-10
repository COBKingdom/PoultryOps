"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type RecruitedByPogp = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  pogpCode: string;
  status: string;
  territory: string | null;
};

type VendPartner = {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  vend_code: string;
  status: string;
  territory: string | null;
  recruited_by_pogp_id: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;

  recruitedByPogp: RecruitedByPogp | null;

  farmCount: number;
  customerCount: number;
  successfulCustomerCount: number;

  commissionTotal: number;
  paidCommission: number;
  pendingCommission: number;
};

type Payment = {
  id: string;
  plan: string | null;
  billingCycle: string | null;
  amountPaid: number;
  transactionId: string | null;
  paymentReference: string | null;
  status: string | null;
  paidAt: string | null;
  createdAt: string | null;
};

type Customer = {
  id: string;

  farmId: string;
  farmName: string;
  farmType: string | null;
  currency: string | null;
  farmActive: boolean | null;

  ownerId: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;

  vendId: string;
  vendName: string;
  vendEmail: string;
  vendPhone: string | null;
  vendCode: string;
  vendTerritory: string | null;

  source: string;
  attributedAt: string;

  subscription: {
    plan: string;
    status: string;
    trialStart: string | null;
    trialEnd: string | null;
    billingCycle: string | null;
    nextBillingDate: string | null;
  } | null;

  paymentCount: number;
  totalPaid: number;

  commissionTotal: number;
  paidCommission: number;
  pendingCommission: number;

  payments: Payment[];
};

type Commission = {
  id: string;

  vendId: string;
  vendName: string;
  vendCode: string;

  farmId: string;
  farmName: string;

  paymentId: string;
  paymentAmount: number;

  commissionType: string;
  amount: number;

  status: string;

  earnedAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

type Summary = {
  totalVends: number;
  activeVends: number;
  vendsWithCustomers: number;
  totalFarmsReferred: number;
  successfulReferrals: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
};

type VendResponse = {
  success: boolean;
  summary?: Summary;
  partners?: VendPartner[];
  customers?: Customer[];
  commissions?: Commission[];
  error?: string;
};

function formatDate(
  value: string | null | undefined
) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(
  value: string | null | undefined
) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNaira(
  value: number | null | undefined
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `₦${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function statusClasses(
  status: string | null | undefined
) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "trial":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "inactive":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-500/20";
  }
}

function statusLabel(
  status: string | null | undefined
) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FarmIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V9l7-5 7 5v12" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 9h.01M17 15h.01" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
      <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  detail,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?:
    | "slate"
    | "blue"
    | "green"
    | "amber";
}) {
  const accents = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accents[accent]}`}
        >
          {accent === "green" ? (
            <MoneyIcon />
          ) : accent === "blue" ? (
            <UsersIcon />
          ) : accent === "amber" ? (
            <FarmIcon />
          ) : (
            <LinkIcon />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminVendPage() {
  const [data, setData] =
    useState<VendResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedVendId, setSelectedVendId] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState(false);

  async function loadVends() {
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
        "/api/admin/vend",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result: VendResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.error ||
            "Unable to load VEND administration data."
        );
        return;
      }

      setData(result);

      if (
        !selectedVendId &&
        result.partners &&
        result.partners.length > 0
      ) {
        setSelectedVendId(
          result.partners[0].id
        );
      }
    } catch (err) {
      console.error(
        "Admin VEND loading error:",
        err
      );

      setError(
        "Unable to load the VEND administration dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVends();
  }, []);

  const filteredPartners =
    useMemo(() => {
      const partners =
        data?.partners || [];

      const query =
        search.trim().toLowerCase();

      return partners.filter(
        (partner) => {
          const matchesSearch =
            !query ||
            partner.full_name
              ?.toLowerCase()
              .includes(query) ||
            partner.email
              ?.toLowerCase()
              .includes(query) ||
            partner.phone
              ?.toLowerCase()
              .includes(query) ||
            partner.vend_code
              ?.toLowerCase()
              .includes(query) ||
            partner.territory
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            partner.status
              ?.toLowerCase() ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      data?.partners,
      search,
      statusFilter,
    ]);

  const selectedVend =
    data?.partners?.find(
      (partner) =>
        partner.id ===
        selectedVendId
    ) || null;

  const selectedCustomers =
    useMemo(() => {
      if (!selectedVendId) {
        return [];
      }

      return (
        data?.customers?.filter(
          (customer) =>
            customer.vendId ===
            selectedVendId
        ) || []
      );
    }, [
      data?.customers,
      selectedVendId,
    ]);

  const selectedCommissions =
    useMemo(() => {
      if (!selectedVendId) {
        return [];
      }

      return (
        data?.commissions?.filter(
          (commission) =>
            commission.vendId ===
            selectedVendId
        ) || []
      );
    }, [
      data?.commissions,
      selectedVendId,
    ]);

  async function copyReferralLink(
    vendCode: string
  ) {
    const url =
      `https://poultry.trueops.app/register?ref=${encodeURIComponent(
        vendCode
      )}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

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
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                VEND Administration
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Unable to load VEND data
              </h1>

              <p className="mt-3 text-slate-600">
                {error}
              </p>

              <button
                onClick={loadVends}
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
                VEND Administration
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Visibility of VEND partners, referred farms,
                successful referrals and commissions.
              </p>
            </div>

            <button
              onClick={loadVends}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh data
            </button>
          </header>

          {/* KPI cards */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <KpiCard
              label="Total VENDs"
              value={
                summary?.totalVends ?? 0
              }
              detail="Registered VEND partners"
            />

            <KpiCard
              label="Active VENDs"
              value={
                summary?.activeVends ?? 0
              }
              detail="Currently active"
              accent="blue"
            />

            <KpiCard
              label="Farms Referred"
              value={
                summary?.totalFarmsReferred ??
                0
              }
              detail="Attributed farms"
              accent="amber"
            />

            <KpiCard
              label="Successful Referrals"
              value={
                summary?.successfulReferrals ??
                0
              }
              detail="Customers with payments"
              accent="green"
            />

            <KpiCard
              label="VENDs With Customers"
              value={
                summary?.vendsWithCustomers ??
                0
              }
              detail="Partners who have referred"
              accent="blue"
            />

            <KpiCard
              label="Commissions Generated"
              value={formatNaira(
                summary?.totalCommissions ??
                  0
              )}
              detail="Total VEND earnings"
              accent="green"
            />

            <KpiCard
              label="Paid Commissions"
              value={formatNaira(
                summary?.paidCommissions ??
                  0
              )}
              detail="Already paid"
              accent="green"
            />

            <KpiCard
              label="Pending Commissions"
              value={formatNaira(
                summary?.pendingCommissions ??
                  0
              )}
              detail="Awaiting payout"
              accent="amber"
            />

          </section>

          {/* Main grid */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">

            {/* VEND list */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      VEND Partners
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      All registered VEND partners and their
                      referral performance.
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
                      placeholder="Search VENDs..."
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

                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
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
                        VEND
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Territory
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Farms
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Successful
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Earned
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">

                    {filteredPartners.map(
                      (partner) => {
                        const selected =
                          partner.id ===
                          selectedVendId;

                        return (
                          <tr
                            key={partner.id}
                            onClick={() =>
                              setSelectedVendId(
                                partner.id
                              )
                            }
                            className={`cursor-pointer transition ${
                              selected
                                ? "bg-blue-50/70"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">
                                {
                                  partner.full_name
                                }
                              </div>

                              <div className="mt-0.5 text-xs font-semibold text-blue-600">
                                {
                                  partner.vend_code
                                }
                              </div>

                              <div className="mt-0.5 text-xs text-slate-500">
                                {
                                  partner.phone ||
                                  partner.email
                                }
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-700">
                              {partner.territory ||
                                "—"}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              {partner.farmCount}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              {
                                partner.successfulCustomerCount
                              }
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                              {formatNaira(
                                partner.commissionTotal
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                                  partner.status
                                )}`}
                              >
                                {statusLabel(
                                  partner.status
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}

                    {filteredPartners.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center text-sm text-slate-500"
                        >
                          No VEND partners match the
                          current filters.
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                Showing{" "}
                {filteredPartners.length} of{" "}
                {data?.partners?.length || 0}{" "}
                VEND partners
              </div>
            </section>

            {/* Selected VEND detail */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              {!selectedVend ? (
                <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UsersIcon />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-900">
                      Select a VEND
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Select a partner from the list to
                      view their referral activity.
                    </p>
                  </div>
                </div>
              ) : (
                <div>

                  {/* VEND identity */}
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                          {selectedVend.full_name
                            .split(" ")
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {
                              selectedVend.full_name
                            }
                          </h2>

                          <div className="mt-0.5 text-sm font-semibold text-blue-600">
                            {
                              selectedVend.vend_code
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Joined{" "}
                            {formatDate(
                              selectedVend.joined_at
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                          selectedVend.status
                        )}`}
                      >
                        {statusLabel(
                          selectedVend.status
                        )}
                      </span>

                    </div>

                    {/* Contact */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        label="Phone / WhatsApp"
                        value={
                          selectedVend.phone ||
                          "Not provided"
                        }
                      />

                      <InfoItem
                        label="Email"
                        value={
                          selectedVend.email ||
                          "Not provided"
                        }
                      />

                      <InfoItem
                        label="Territory"
                        value={
                          selectedVend.territory ||
                          "Not assigned"
                        }
                      />

                      <InfoItem
                        label="Farms referred"
                        value={String(
                          selectedVend.farmCount
                        )}
                      />
                    </div>
                  </div>

                  {/* Referral link */}
                  <div className="border-b border-slate-200 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Farmer Referral Link
                    </div>

                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="break-all text-xs text-slate-600">
                        https://poultry.trueops.app/register?ref=
                        {
                          selectedVend.vend_code
                        }
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        copyReferralLink(
                          selectedVend.vend_code
                        )
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <CopyIcon />
                      {copied
                        ? "Copied"
                        : "Copy Link"}
                    </button>
                  </div>

                  {/* Commission summary */}
                  <div className="border-b border-slate-200 p-5">
                    <div className="text-sm font-bold text-slate-900">
                      Earnings
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <MiniStat
                        label="Earned"
                        value={formatNaira(
                          selectedVend.commissionTotal
                        )}
                      />

                      <MiniStat
                        label="Paid"
                        value={formatNaira(
                          selectedVend.paidCommission
                        )}
                      />

                      <MiniStat
                        label="Pending"
                        value={formatNaira(
                          selectedVend.pendingCommission
                        )}
                      />
                    </div>
                  </div>

                  {/* Recruited by POGP */}
                  {selectedVend.recruitedByPogp && (
                    <div className="border-b border-slate-200 p-5">
                      <div className="text-sm font-bold text-slate-900">
                        Recruited By POGP
                      </div>

                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                        <div className="font-semibold text-slate-900">
                          {
                            selectedVend
                              .recruitedByPogp
                              .fullName
                          }
                        </div>

                        <div className="mt-1 text-xs font-semibold text-blue-700">
                          {
                            selectedVend
                              .recruitedByPogp
                              .pogpCode
                          }
                        </div>

                        <div className="mt-2 text-xs text-slate-600">
                          {
                            selectedVend
                              .recruitedByPogp
                              .email
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Referred farms */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Referred Farms
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Farms attributed to this VEND.
                        </div>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {
                          selectedCustomers.length
                        }
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">

                      {selectedCustomers.map(
                        (customer) => (
                          <div
                            key={
                              customer.id
                            }
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">
                                  {
                                    customer.farmName
                                  }
                                </div>

                                <div className="mt-0.5 text-xs text-slate-500">
                                  {
                                    customer.ownerName
                                  }
                                </div>

                                <div className="mt-0.5 truncate text-xs text-slate-400">
                                  {
                                    customer.ownerEmail
                                  }
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses(
                                  customer
                                    .subscription
                                    ?.status
                                )}`}
                              >
                                {statusLabel(
                                  customer
                                    .subscription
                                    ?.status
                                )}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-md bg-slate-50 p-2">
                                <div className="text-slate-400">
                                  Payments
                                </div>

                                <div className="mt-0.5 font-semibold text-slate-700">
                                  {
                                    customer.paymentCount
                                  }
                                </div>
                              </div>

                              <div className="rounded-md bg-slate-50 p-2">
                                <div className="text-slate-400">
                                  Paid
                                </div>

                                <div className="mt-0.5 font-semibold text-slate-700">
                                  {formatNaira(
                                    customer.totalPaid
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                              <div className="text-[11px] text-slate-400">
                                Referred{" "}
                                {formatDate(
                                  customer.attributedAt
                                )}
                              </div>

                              <div className="text-xs font-semibold text-slate-700">
                                Commission{" "}
                                {formatNaira(
                                  customer.commissionTotal
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      {selectedCustomers.length ===
                        0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                          <div className="text-sm font-semibold text-slate-700">
                            No farms referred yet
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            This VEND has not generated a
                            customer attribution.
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              )}
            </section>
          </div>

          {/* Commission history */}
          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Commission History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Commission records generated from VEND
                    referrals.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {selectedCommissions.length} records
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      VEND
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Farm
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Commission
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Earned
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">

                  {selectedCommissions.map(
                    (commission) => (
                      <tr
                        key={
                          commission.id
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {
                              commission.vendName
                            }
                          </div>

                          <div className="mt-0.5 text-xs font-semibold text-blue-600">
                            {
                              commission.vendCode
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-slate-800">
                            {
                              commission.farmName
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {statusLabel(
                            commission.commissionType
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatNaira(
                            commission.paymentAmount
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                          {formatNaira(
                            commission.amount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                              commission.status
                            )}`}
                          >
                            {statusLabel(
                              commission.status
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {formatDateTime(
                            commission.earnedAt
                          )}
                        </td>
                      </tr>
                    )
                  )}

                  {selectedCommissions.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center"
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          No commission records yet
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Commissions will appear here when
                          qualifying payments are recorded.
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </section>

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
                  VEND attribution status
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  VEND referral attribution is linked to the
                  original farmer referral source. Commission
                  records are displayed from the VEND commission
                  ledger and are not manually calculated by this
                  dashboard.
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </AppShell>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[11px] text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </div>
    </div>
  );
}