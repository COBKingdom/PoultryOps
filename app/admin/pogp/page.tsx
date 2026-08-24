"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type Partner = {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string;
  pogp_code: string;
  status: string;
  territory: string | null;
  joined_at: string;
  notes: string | null;
  created_at: string;
  prospectCount: number;
  customerCount: number;
  commissionTotal: number;
};

type Customer = {
  id: string;
  farmId: string;
  farmName: string;
  farmType: string | null;
  currency: string | null;
  farmActive: boolean;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  pogpId: string | null;
  pogpName: string;
  pogpEmail: string;
  pogpCode: string;
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
};

type Summary = {
  totalPartners: number;
  activePartners: number;
  totalProspects: number;
  totalCustomers: number;
  totalCommission: number;
};

export default function POGPPage() {
  const router = useRouter();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [summary, setSummary] = useState<Summary>({
    totalPartners: 0,
    activePartners: 0,
    totalProspects: 0,
    totalCustomers: 0,
    totalCommission: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [customerFilter, setCustomerFilter] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // New POGP form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [territory, setTerritory] = useState("");
  const [notes, setNotes] = useState("");

  async function getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "No active authentication session"
      );
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const headers = await getAuthHeaders();

      const response = await fetch(
        "/api/admin/pogp",
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load POGP data"
        );
      }

      setPartners(data.partners || []);
      setCustomers(data.customers || []);

      setSummary(
        data.summary || {
          totalPartners: 0,
          activePartners: 0,
          totalProspects: 0,
          totalCustomers: 0,
          totalCommission: 0,
        }
      );
    } catch (error) {
      console.error(
        "Unable to load POGP data:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load POGP data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhone("");
    setTerritory("");
    setNotes("");
  }

  function closeModal() {
    if (saving) return;

    setShowAdd(false);
    resetForm();
    setMessage("");
  }

  function openAllCustomers() {
    setCustomerFilter(null);
    setShowCustomers(true);
  }

  function openPartnerCustomers(
    partnerId: string
  ) {
    setCustomerFilter(partnerId);
    setShowCustomers(true);
  }

  function closeCustomers() {
    setShowCustomers(false);
    setCustomerFilter(null);
  }

  async function handleCreate() {
    if (!fullName.trim()) {
      setMessage(
        "Full name is required."
      );
      return;
    }

    if (!email.trim()) {
      setMessage(
        "Email address is required."
      );
      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Phone number is required."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const headers =
        await getAuthHeaders();

      const response = await fetch(
        "/api/admin/pogp",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            fullName:
              fullName.trim(),
            email:
              email.trim(),
            phone:
              phone.trim(),
            territory:
              territory.trim(),
            notes:
              notes.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to create POGP"
        );
      }

      setShowAdd(false);
      resetForm();

      setMessage(
        `${
          data.partner?.pogp_code ||
          "POGP"
        } created successfully.`
      );

      await loadData();
    } catch (error) {
      console.error(
        "Unable to create POGP:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create POGP"
      );
    } finally {
      setSaving(false);
    }
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  function formatDate(
    value: string | null | undefined
  ) {
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

  const visibleCustomers =
    customerFilter
      ? customers.filter(
          (customer) =>
            customer.pogpId ===
            customerFilter
        )
      : customers;

  const selectedPartner =
    customerFilter
      ? partners.find(
          (partner) =>
            partner.id ===
            customerFilter
        )
      : null;

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() =>
                  router.push("/admin")
                }
                className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                ← Admin Control Centre
              </button>

              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                PoultryOps
              </div>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                PoultryOps Growth Partners
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                Manage referral partners,
                customer attribution and
                commission activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setShowAdd(true);
              }}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              + Add POGP
            </button>
          </div>

          {/* Message */}
          {message && !showAdd && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              {message}
            </div>
          )}

          {/* KPIs */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <Kpi
              label="Active POGPs"
              value={
                summary.activePartners
              }
              detail={`${summary.totalPartners} total partners`}
            />

            <Kpi
              label="Prospects"
              value={
                summary.totalProspects
              }
              detail="Registered POGP prospects"
            />

            {/* CLICKABLE CUSTOMERS KPI */}
            <button
              type="button"
              onClick={
                openAllCustomers
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-sm font-medium text-slate-500">
                Customers
              </div>

              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {summary.totalCustomers}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Attributed customers
              </div>

              <div className="mt-3 text-xs font-semibold text-blue-600">
                View customers →
              </div>
            </button>

            <Kpi
              label="Commission"
              value={formatMoney(
                summary.totalCommission
              )}
              detail="Recorded commission"
            />

          </div>

          {/* Partners */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-5 py-5 md:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    POGP Partners
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your PoultryOps
                    Growth Partners and
                    referral codes.
                  </p>
                </div>

                <div className="text-sm text-slate-400">
                  {summary.totalPartners}{" "}
                  partner
                  {summary.totalPartners ===
                  1
                    ? ""
                    : "s"}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : partners.length ===
              0 ? (
              <div className="px-6 py-20 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-500">
                  P
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  No POGP partners yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Create your first
                  PoultryOps Growth
                  Partner. Their referral
                  code will be generated
                  automatically.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setShowAdd(true);
                  }}
                  className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  + Add First POGP
                </button>

              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-4">
                          Partner
                        </th>
                        <th className="px-6 py-4">
                          POGP Code
                        </th>
                        <th className="px-6 py-4">
                          Territory
                        </th>
                        <th className="px-6 py-4">
                          Prospects
                        </th>
                        <th className="px-6 py-4">
                          Customers
                        </th>
                        <th className="px-6 py-4">
                          Commission
                        </th>
                        <th className="px-6 py-4">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {partners.map(
                        (partner) => (
                          <tr
                            key={
                              partner.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-950">
                                {partner.full_name ||
                                  "Unnamed partner"}
                              </div>

                              <div className="mt-1 text-sm text-slate-500">
                                {
                                  partner.email
                                }
                              </div>

                              {partner.phone && (
                                <div className="mt-1 text-xs text-slate-400">
                                  {
                                    partner.phone
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                                {
                                  partner.pogp_code
                                }
                              </span>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {partner.territory ||
                                "—"}
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                              {
                                partner.prospectCount
                              }
                            </td>

                            {/* CLICKABLE PARTNER CUSTOMER COUNT */}
                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  openPartnerCustomers(
                                    partner.id
                                  )
                                }
                                className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-800 hover:underline"
                              >
                                {
                                  partner.customerCount
                                }
                              </button>
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                              {formatMoney(
                                partner.commissionTotal
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                status={
                                  partner.status
                                }
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {partners.map(
                    (partner) => (
                      <div
                        key={
                          partner.id
                        }
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-950">
                              {partner.full_name ||
                                "Unnamed partner"}
                            </h3>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {
                                partner.email
                              }
                            </p>

                            {partner.phone && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  partner.phone
                                }
                              </p>
                            )}
                          </div>

                          <StatusBadge
                            status={
                              partner.status
                            }
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                            {
                              partner.pogp_code
                            }
                          </span>

                          <span className="text-sm text-slate-500">
                            {partner.territory ||
                              "No territory"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <MiniStat
                            label="Prospects"
                            value={
                              partner.prospectCount
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              openPartnerCustomers(
                                partner.id
                              )
                            }
                            className="rounded-xl bg-blue-50 p-3 text-left transition hover:bg-blue-100"
                          >
                            <div className="text-xs text-blue-500">
                              Customers
                            </div>

                            <div className="mt-1 text-sm font-bold text-blue-700">
                              {
                                partner.customerCount
                              }
                            </div>
                          </button>

                          <MiniStat
                            label="Commission"
                            value={formatMoney(
                              partner.commissionTotal
                            )}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </section>

          {/* Information */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
            POGP partners are independent
            PoultryOps referral partners.
            They are not farm users. Each
            partner receives a unique referral
            code that can be used when
            registering new farms.
          </div>

        </div>
      </main>

      {/* ====================================================== */}
      {/* CUSTOMER LIST MODAL */}
      {/* ====================================================== */}

      {showCustomers && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 md:p-8">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-2xl">

            {/* Customer modal header */}
            <div className="border-b border-slate-200 px-5 py-5 md:px-6">
              <div className="flex items-start justify-between gap-4">

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                    PoultryOps
                  </div>

                  <h2 className="mt-1 text-2xl font-bold text-slate-950">
                    {selectedPartner
                      ? `${selectedPartner.full_name || "POGP"} — Customers`
                      : "Customers"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPartner
                      ? `Customers attributed to ${selectedPartner.pogp_code}.`
                      : "All farms currently attributed to PoultryOps Growth Partners."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCustomers
                  }
                  className="rounded-lg px-3 py-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close customers"
                >
                  ×
                </button>

              </div>
            </div>

            {/* Customer count */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 md:px-6">
              <div className="text-sm font-medium text-slate-600">
                {visibleCustomers.length}{" "}
                customer
                {visibleCustomers.length ===
                1
                  ? ""
                  : "s"}
              </div>
            </div>

            {/* Customer list */}
            {visibleCustomers.length ===
            0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-400">
                  C
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  No customers yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Customers attributed to
                  this POGP will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-slate-200 bg-white">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">
                        Farm
                      </th>
                      <th className="px-6 py-4">
                        Owner
                      </th>
                      <th className="px-6 py-4">
                        POGP
                      </th>
                      <th className="px-6 py-4">
                        Attributed
                      </th>
                      <th className="px-6 py-4">
                        Plan
                      </th>
                      <th className="px-6 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleCustomers.map(
                      (customer) => (
                        <tr
                          key={
                            customer.id
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin/customers/${customer.farmId}`
                                )
                              }
                              className="font-semibold text-blue-700 hover:underline"
                            >
                              {
                                customer.farmName
                              }
                            </button>

                            <div className="mt-1 text-xs text-slate-400">
                              {customer.farmType ||
                                "Poultry"}{" "}
                              ·{" "}
                              {customer.currency ||
                                "NGN"}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="font-medium text-slate-900">
                              {
                                customer.ownerName
                              }
                            </div>

                            <div className="mt-1 text-sm text-slate-500">
                              {
                                customer.ownerEmail
                              }
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                              {
                                customer.pogpCode
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {formatDate(
                              customer.attributedAt
                            )}
                          </td>

                          <td className="px-6 py-5 text-sm font-medium text-slate-900">
                            {customer
                              .subscription
                              ?.plan ||
                              "—"}
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge
                              status={
                                customer
                                  .subscription
                                  ?.status ||
                                "Unknown"
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">

              <button
                type="button"
                onClick={
                  closeCustomers
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                ← Back to POGP Partners
              </button>

              {selectedPartner && (
                <button
                  type="button"
                  onClick={
                    openAllCustomers
                  }
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View All Customers
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* ADD POGP MODAL */}
      {/* ====================================================== */}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Add POGP Partner
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an independent
                    PoultryOps Growth Partner.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="text-xl leading-none text-slate-400 transition hover:text-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="space-y-5 px-6 py-6">

              <Field
                label="Full Name"
                required
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. John Smith"
                  className="input-field"
                  autoFocus
                />
              </Field>

              <Field
                label="Email Address"
                required
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="e.g. john@example.com"
                  className="input-field"
                />
              </Field>

              <Field
                label="Phone Number"
                required
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="e.g. +234 801 234 5678"
                  className="input-field"
                />
              </Field>

              <Field label="Territory">
                <input
                  type="text"
                  value={territory}
                  onChange={(e) =>
                    setTerritory(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Lagos"
                  className="input-field"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Optional notes about this partner"
                  rows={3}
                  className="input-field resize-none"
                />
              </Field>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="text-sm font-semibold text-blue-900">
                  Referral code
                </div>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  PoultryOps will automatically
                  generate the next available
                  code, such as{" "}
                  <strong>POGP-001</strong>.
                </p>
              </div>

              {message && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {message}
                </div>
              )}

            </div>

            {/* Modal footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create POGP"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Small reusable input styling */}
      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .input-field::placeholder {
          color: rgb(148 163 184);
        }

        .input-field:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px
            rgb(37 99 235 / 0.1);
        }

        .input-field:disabled {
          background: rgb(248 250 252);
          cursor: not-allowed;
        }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status.toLowerCase() ===
    "active";

  const trial =
    status.toLowerCase() ===
    "trial";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : trial
            ? "bg-blue-50 text-blue-700"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {detail}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}