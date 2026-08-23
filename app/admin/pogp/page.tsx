"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type Partner = {
  id: string;
  profile_id: string;
  pogp_code: string;
  status: string;
  territory: string | null;
  joined_at: string;
  notes: string | null;

  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;

  prospectCount: number;
  customerCount: number;
  commissionTotal: number;
};

type Summary = {
  totalPartners: number;
  activePartners: number;
  totalProspects: number;
  totalCustomers: number;
  totalCommission: number;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export default function POGPPage() {
      async function getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No active authentication session");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  const router = useRouter();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalPartners: 0,
    activePartners: 0,
    totalProspects: 0,
    totalCustomers: 0,
    totalCommission: 0,
  });

  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileId, setProfileId] = useState("");
  const [pogpCode, setPogpCode] = useState("");
  const [territory, setTerritory] = useState("");

  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const headers = await getAuthHeaders();

const response = await fetch("/api/admin/pogp", {
  method: "GET",
  headers,
});

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load POGP data"
        );
      }

      setPartners(data.partners || []);
      setSummary(data.summary);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load POGP data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles() {
    try {
      /*
       * We use the existing admin users API so we don't
       * create another user lookup system.
       */
      const headers = await getAuthHeaders();

const response = await fetch("/api/admin/users", {
  method: "GET",
  headers,
});

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const users = data.users || [];

      setProfiles(
        users.map((user: any) => ({
          id: user.user_id,
          email: user.email || null,
          full_name: user.profile?.full_name || null,
        }))
      );
    } catch (error) {
      console.error("Unable to load profiles:", error);
    }
  }

  useEffect(() => {
    loadData();
    loadProfiles();
  }, []);

  async function handleCreate() {
    if (!profileId || !pogpCode.trim()) {
      setMessage(
        "Select a user and enter a POGP code."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

const headers = await getAuthHeaders();

const response = await fetch("/api/admin/pogp", {
  method: "POST",
  headers,
        body: JSON.stringify({
          profileId,
          pogpCode,
          territory,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to create POGP"
        );
      }

      setShowAdd(false);
      setProfileId("");
      setPogpCode("");
      setTerritory("");

      setMessage("POGP partner created successfully.");

      await loadData();
    } catch (error) {
      console.error(error);

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
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

return (
  <AppShell>
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="mb-4 text-sm text-slate-500 hover:text-slate-900"
            >
              ← Admin Control Centre
            </button>

            <div className="text-xs font-semibold tracking-[0.25em] text-slate-500">
              POULTRYOPS
            </div>

<h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
  PoultryOps Growth Partners
</h1>

<p className="mt-2 text-slate-500">
  Manage partners, referrals, customer attribution and commission.
</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Add POGP
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {message}
          </div>
        )}

        {/* KPI cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Kpi
            label="Active POGPs"
            value={summary.activePartners}
            detail={`${summary.totalPartners} total partners`}
          />

          <Kpi
            label="Prospects"
            value={summary.totalProspects}
            detail="Registered POGP prospects"
          />

          <Kpi
            label="Customers"
            value={summary.totalCustomers}
            detail="Attributed customers"
          />

          <Kpi
            label="Commission"
            value={formatMoney(summary.totalCommission)}
            detail="Recorded commission"
          />

        </section>

        {/* Partners */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              POGP Partners
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage partners and their referral codes.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading POGP partners...
            </div>
          ) : partners.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <div className="text-lg font-semibold text-slate-900">
                No POGP partners yet
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Create the first POGP partner to get started.
              </p>

              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-5 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                + Add First POGP
              </button>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Partner
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Territory
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Prospects
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customers
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Commission
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {partners.map((partner) => (

                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800">
                          {partner.pogp_code}
                        </span>
                      </td>

                      <td className="px-6 py-4">

                        <div className="font-medium text-slate-900">
                          {partner.profile?.full_name ||
                            "Unnamed user"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {partner.profile?.email || "—"}
                        </div>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {partner.territory || "—"}
                      </td>

                      <td className="px-6 py-4">

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          {partner.status}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {partner.prospectCount}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {partner.customerCount}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {formatMoney(partner.commissionTotal)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(partner.joined_at)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* Footer */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
          POGP data is managed through the PoultryOps platform administration system.
        </div>

      </div>

      {/* Add POGP modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Add POGP Partner
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a partner and referral code.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  User
                </label>

                <select
                  value={profileId}
                  onChange={(event) =>
                    setProfileId(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Select user...
                  </option>

                  {profiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {profile.full_name ||
                        "Unnamed user"}{" "}
                      — {profile.email || profile.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  POGP Code
                </label>

                <input
                  value={pogpCode}
                  onChange={(event) =>
                    setPogpCode(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="POGP-001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-slate-500"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  This will eventually be the customer's referral code.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Territory
                </label>

                <input
                  value={territory}
                  onChange={(event) =>
                    setTerritory(event.target.value)
                  }
                  placeholder="e.g. Lagos"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                onClick={() => setShowAdd(false)}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create POGP"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  </AppShell>
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

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