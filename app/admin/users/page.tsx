"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Membership = {
  farm_id: string;
  farm_name: string | null;
  farm_type: string | null;
  currency: string | null;
  farm_active: boolean | null;
  role: string | null;
  status: string | null;
  joined_at: string | null;
};

type User = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  farm_count: number;
  memberships: Membership[];
};

type UsersResponse = {
  success: boolean;
  total?: number;
  users?: User[];
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "�";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClasses(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "inactive":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "suspended":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function roleClasses(role: string | null | undefined) {
  switch ((role || "").toLowerCase()) {
    case "owner":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "staff":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function initials(user: User) {
  const source = user.full_name || user.email || "User";
  const parts = source.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result: UsersResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load platform users.");
        return;
      }

      setUsers(result.users || []);
    } catch (err) {
      console.error("Admin users loading error:", err);
      setError("Unable to load platform users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.memberships.some((membership) =>
          membership.farm_name?.toLowerCase().includes(query)
        );

      const matchesRole =
        roleFilter === "all" ||
        (user.role || "").toLowerCase() === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (user.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const assignedUsers = users.filter((user) => user.farm_count > 0).length;
  const unassignedUsers = users.filter((user) => user.farm_count === 0).length;
  const ownerCount = users.filter(
    (user) => (user.role || "").toLowerCase() === "owner"
  ).length;
  const staffCount = users.filter(
    (user) => (user.role || "").toLowerCase() === "staff"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-72 rounded-lg bg-slate-200" />
            <div className="h-5 w-96 rounded-lg bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-xl bg-white shadow-sm"
                />
              ))}
            </div>
            <div className="h-[520px] rounded-xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => router.push("/admin")}
            className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ? Admin Control Centre
          </button>

          <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Platform users
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Unable to load users
            </h1>

            <p className="mt-2 text-slate-500">{error}</p>

            <button
              onClick={loadUsers}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ? Admin Control Centre
            </button>

            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              PoultryOps
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Platform Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Central visibility of every user account and farm membership.
            </p>
          </div>

          <button
            onClick={loadUsers}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Refresh data
          </button>
        </div>

        {/* KPI summary */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UserKpi
            label="Total Users"
            value={users.length}
            detail="Platform accounts"
          />

          <UserKpi
            label="Farm Members"
            value={assignedUsers}
            detail="Assigned to a farm"
            accent="blue"
          />

          <UserKpi
            label="Unassigned"
            value={unassignedUsers}
            detail="No farm membership"
            accent={unassignedUsers > 0 ? "amber" : "green"}
          />

          <UserKpi
            label="Owners / Staff"
            value={`${ownerCount} / ${staffCount}`}
            detail="Account role split"
            accent="violet"
          />
        </section>

        {/* Main users panel */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  User Directory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search and inspect platform accounts and their farm
                  associations.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users or farms..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:w-64"
                />

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">All roles</option>
                  <option value="owner">Owners</option>
                  <option value="staff">Staff</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Farm
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Joined
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last sign-in
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                          {initials(user)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {user.full_name || "Unnamed user"}
                          </div>

                          <div className="truncate text-xs text-slate-500">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${roleClasses(
                          user.role
                        )}`}
                      >
                        {user.role || "Unassigned"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {user.memberships.length > 0 ? (
                        <div className="space-y-1">
                          {user.memberships.slice(0, 2).map((membership) => (
                            <div
                              key={`${user.user_id}-${membership.farm_id}`}
                              className="text-sm text-slate-700"
                            >
                              {membership.farm_name || "Unnamed farm"}
                            </div>
                          ))}

                          {user.memberships.length > 2 && (
                            <div className="text-xs font-medium text-slate-400">
                              +{user.memberships.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No farm assigned
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusClasses(
                          user.status
                        )}`}
                      >
                        {user.status || "Unknown"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.last_sign_in_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredUsers.map((user) => (
              <div key={user.user_id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                    {initials(user)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">
                      {user.full_name || "Unnamed user"}
                    </div>

                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {user.email || "No email"}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${roleClasses(
                          user.role
                        )}`}
                      >
                        {user.role || "Unassigned"}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusClasses(
                          user.status
                        )}`}
                      >
                        {user.status || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Farm membership
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    {user.memberships.length > 0
                      ? user.memberships
                          .map((membership) =>
                            membership.farm_name || "Unnamed farm"
                          )
                          .join(", ")
                      : "No farm assigned"}
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Joined {formatDate(user.created_at)}</span>
                  <span>Last sign-in {formatDate(user.last_sign_in_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                ?
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No users found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing the search or filters.
              </p>
            </div>
          )}

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:px-6">
            Showing {filteredUsers.length} of {users.length} platform users
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row">
          <span className="font-medium text-slate-600">
            PoultryOps Platform Administration
          </span>

          <span>
            User data is read directly from the existing platform systems.
          </span>
        </div>
      </div>
    </main>
  );
}

function UserKpi({
  label,
  value,
  detail,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: "slate" | "blue" | "amber" | "green" | "violet";
}) {
  const accents = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
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
          className={`h-3 w-3 rounded-full ${accents[accent]}`}
        />
      </div>
    </div>
  );
}
