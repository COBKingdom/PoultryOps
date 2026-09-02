"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
    useState<
      "overview" |
      "customers" |
      "prospects" |
      "network" |
      "earnings"
    >("overview");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadPortal();
  }, []);

  async function loadPortal() {
    try {
      setLoading(true);
      setError("");

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

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

      setSummary(
        data.summary || {}
      );

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

  function formatMoney(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  }

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  }

  function commissionLabel(
    type: string
  ) {
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

  function navButton(
    section:
      | "overview"
      | "customers"
      | "prospects"
      | "network"
      | "earnings",
    label: string
  ) {
    return (
      <button
        type="button"
        onClick={() =>
          setActiveSection(section)
        }
        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
          activeSection === section
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {label}
      </button>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">
          Loading your partner portal...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
          <h1 className="text-xl font-bold text-slate-900">
            Unable to load portal
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={loadPortal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-white p-5 md:block">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              PoultryOps
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Growth Partner
            </h1>

            {partner && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">
                  {partner.full_name ||
                    "Growth Partner"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {partner.pogp_code}
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {navButton(
              "overview",
              "Overview"
            )}

            {navButton(
              "customers",
              "My Customers"
            )}

            {navButton(
              "prospects",
              "My Prospects"
            )}

            {navButton(
              "network",
              "My Network"
            )}

            {navButton(
              "earnings",
              "My Earnings"
            )}
          </nav>

          <div className="mt-8 border-t pt-5">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/profile"
                )
              }
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              My Profile
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 p-4 md:p-8">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between md:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                PoultryOps
              </p>

              <h1 className="text-xl font-bold">
                Growth Partner
              </h1>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-red-600"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile navigation */}
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "overview"
                )
              }
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm"
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "customers"
                )
              }
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm"
            >
              Customers
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "prospects"
                )
              }
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm"
            >
              Prospects
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "network"
                )
              }
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm"
            >
              Network
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "earnings"
                )
              }
              className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm"
            >
              Earnings
            </button>
          </div>

          {/* Page heading */}
          <div className="mb-7">
            <p className="text-sm font-medium text-blue-600">
              POGP Portal
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              {activeSection ===
              "overview"
                ? `Welcome${
                    partner?.full_name
                      ? `, ${partner.full_name.split(" ")[0]}`
                      : ""
                  }`
                : activeSection ===
                    "customers"
                  ? "My Customers"
                  : activeSection ===
                      "prospects"
                    ? "My Prospects"
                    : activeSection ===
                        "network"
                      ? "My Network"
                      : "My Earnings"}
            </h2>
          </div>

          {/* Overview */}
          {activeSection ===
            "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Customers"
                  value={
                    summary.totalCustomers
                  }
                />

                <StatCard
                  label="Prospects"
                  value={
                    summary.totalProspects
                  }
                />

                <StatCard
                  label="Total Earned"
                  value={formatMoney(
                    summary.totalEarned
                  )}
                />

                <StatCard
                  label="Pending"
                  value={formatMoney(
                    summary.pendingCommission
                  )}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    My Network
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Referral partners you have brought into the network.
                  </p>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {
                          summary.networkPartners
                        }
                      </p>

                      <p className="text-sm text-slate-500">
                        Partners
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatMoney(
                          summary.networkCommissionTotal
                        )}
                      </p>

                      <p className="text-sm text-slate-500">
                        Network earnings
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        "network"
                      )
                    }
                    className="mt-5 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    View network →
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">
                    Recent Earnings
                  </h3>

                  {earnings.length ===
                  0 ? (
                    <p className="mt-5 text-sm text-slate-500">
                      No commission records yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {earnings
                        .slice(0, 5)
                        .map(
                          (
                            commission
                          ) => (
                            <div
                              key={
                                commission.id
                              }
                              className="flex items-center justify-between border-b pb-3 last:border-0"
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  {commissionLabel(
                                    commission.commission_type
                                  )}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {formatDate(
                                    commission.earned_at
                                  )}
                                </p>
                              </div>

                              <p className="font-semibold">
                                {formatMoney(
                                  commission.amount
                                )}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        "earnings"
                      )
                    }
                    className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    View all earnings →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Customers */}
          {activeSection ===
            "customers" && (
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b p-5">
                <h3 className="font-bold">
                  Customers I Referred
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Customers attributed to your POGP account.
                </p>
              </div>

              {customers.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  You do not have any attributed customers yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">
                          Customer
                        </th>

                        <th className="px-5 py-3">
                          Referred
                        </th>

                        <th className="px-5 py-3">
                          Source
                        </th>

                        <th className="px-5 py-3 text-right">
                          Earnings
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {customers.map(
                        (customer) => (
                          <tr
                            key={
                              customer.id
                            }
                            className="border-t"
                          >
                            <td className="px-5 py-4 font-semibold">
                              {
                                customer.farmName
                              }
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {formatDate(
                                customer.attributedAt
                              )}
                            </td>

                            <td className="px-5 py-4 capitalize text-slate-500">
                              {customer.source ||
                                "Referral"}
                            </td>

                            <td className="px-5 py-4 text-right font-semibold">
                              {formatMoney(
                                customer.commissionTotal
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
          )}

          {/* Prospects */}
          {activeSection ===
            "prospects" && (
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b p-5">
                <h3 className="font-bold">
                  My Prospects
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Prospective poultry businesses you are following up.
                </p>
              </div>

              {prospects.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No prospects have been recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">
                          Farm
                        </th>

                        <th className="px-5 py-3">
                          Contact
                        </th>

                        <th className="px-5 py-3">
                          Status
                        </th>

                        <th className="px-5 py-3">
                          Added
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {prospects.map(
                        (prospect) => (
                          <tr
                            key={
                              prospect.id
                            }
                            className="border-t"
                          >
                            <td className="px-5 py-4 font-semibold">
                              {
                                prospect.farm_name
                              }
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {
                                prospect.contact_name ||
                                prospect.phone ||
                                prospect.email ||
                                "—"
                              }
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize">
                                {
                                  prospect.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {formatDate(
                                prospect.created_at
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
          )}

          {/* Network */}
          {activeSection ===
            "network" && (
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b p-5">
                <h3 className="font-bold">
                  My Referral Network
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Partners you recruited and the activity generated through your network.
                </p>
              </div>

              {network.length ===
              0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  You have not recruited any referral partners yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">
                          Partner
                        </th>

                        <th className="px-5 py-3">
                          Code
                        </th>

                        <th className="px-5 py-3">
                          Customers
                        </th>

                        <th className="px-5 py-3 text-right">
                          Earnings
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {network.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                            className="border-t"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold">
                                {
                                  item.full_name
                                }
                              </p>

                              {item.business_name && (
                                <p className="text-xs text-slate-500">
                                  {
                                    item.business_name
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4 font-mono text-xs text-slate-500">
                              {
                                item.referral_code
                              }
                            </td>

                            <td className="px-5 py-4">
                              {
                                item.customerCount
                              }
                            </td>

                            <td className="px-5 py-4 text-right font-semibold">
                              {formatMoney(
                                item.earnings
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
          )}

          {/* Earnings */}
          {activeSection ===
            "earnings" && (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total Earned"
                  value={formatMoney(
                    summary.totalEarned
                  )}
                />

                <StatCard
                  label="Paid"
                  value={formatMoney(
                    summary.paidCommission
                  )}
                />

                <StatCard
                  label="Pending"
                  value={formatMoney(
                    summary.pendingCommission
                  )}
                />
              </div>

              <div className="rounded-2xl bg-white shadow-sm">
                <div className="border-b p-5">
                  <h3 className="font-bold">
                    Commission History
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your recorded PoultryOps commissions.
                  </p>
                </div>

                {earnings.length ===
                0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No commission records yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3">
                            Date
                          </th>

                          <th className="px-5 py-3">
                            Type
                          </th>

                          <th className="px-5 py-3">
                            Status
                          </th>

                          <th className="px-5 py-3 text-right">
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
                              className="border-t"
                            >
                              <td className="px-5 py-4 text-slate-500">
                                {formatDate(
                                  commission.earned_at
                                )}
                              </td>

                              <td className="px-5 py-4 font-medium">
                                {commissionLabel(
                                  commission.commission_type
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize">
                                  {
                                    commission.status
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right font-semibold">
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
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}