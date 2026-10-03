"use client";

import React, {
  useState,
  useMemo,
} from "react";

import {
  Users,
  Search,
  Shield,
  UserCheck,
  Plus,
} from "lucide-react";

import MemberCard from "./member-card";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

type Props = {
  farmId: string;
  onMemberSelect: (memberId: string) => void;
  selectedMemberId: string | null;
};

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status:
    | "active"
    | "inactive"
    | "pending";
  created_at: string;
  last_sign_in_at?: string;
};

export default function TeamCard({
  farmId,
  onMemberSelect,
  selectedMemberId,
}: Props) {
  const { can } = usePermissions();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState<string>("all");

  const [statusFilter, setStatusFilter] =
    useState<string>("all");

  const [members, setMembers] =
    useState<Member[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const canInvite =
    can(PERMISSIONS.TEAM_INVITE);

  // Load team members from API
  React.useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);

        // Get the current session to include JWT in Authorization header
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type":
            "application/json",
        };

        if (session?.access_token) {
          headers.Authorization =
            `Bearer ${session.access_token}`;
        }

        const response =
          await fetch("/api/team", {
            headers,
          });

        console.log(
          "Team API response status:",
          response.status
        );

        const text =
          await response.text();

        console.log(
          "Team API response body:",
          text
        );

        if (!response.ok) {
          throw new Error(
            `Status ${response.status}: ${text}`
          );
        }

        const data = JSON.parse(text);

        setMembers(
          data.members || []
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load team members";

        console.error(
          "Team API error:",
          err
        );

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (farmId) {
      loadMembers();
    }
  }, [farmId]);

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) => {
        const fullName =
          member.full_name ?? "";

        const email =
          member.email ?? "";

        const role =
          member.role ?? "";

        const status =
          member.status ?? "active";

        const query =
          searchQuery.toLowerCase();

        const matchesSearch =
          fullName
            .toLowerCase()
            .includes(query) ||
          email
            .toLowerCase()
            .includes(query);

        const matchesRole =
          roleFilter === "all" ||
          role === roleFilter;

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      }
    );
  }, [
    members,
    searchQuery,
    roleFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const total =
      members.length;

    const managers =
      members.filter(
        (member) =>
          (member.role ?? "") ===
          "manager"
      ).length;

    const staff =
      members.filter(
        (member) =>
          (member.role ?? "") ===
          "staff"
      ).length;

    const active =
      members.filter(
        (member) =>
          (member.status ??
            "active") ===
          "active"
      ).length;

    return {
      total,
      managers,
      staff,
      active,
    };
  }, [members]);

  if (loading) {
    return (
      <div className="space-y-6">

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(
            (i) => (
              <div
                key={i}
                className="
                  relative overflow-hidden
                  rounded-xl
                  border border-blue-100
                  bg-white
                  p-5
                  shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
                "
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

                <div className="space-y-3 pt-1">
                  <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />

                  <div className="h-9 w-16 bg-slate-200 rounded animate-pulse" />

                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            )
          )}
        </div>

        {/* Content Skeleton */}
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border border-blue-100
            bg-white
            p-5
            shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

          <div className="space-y-4 pt-1">
            <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />

            {[1, 2, 3].map(
              (i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 rounded-xl animate-pulse"
                />
              )
            )}
          </div>
        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div
        className="
          relative overflow-hidden
          rounded-xl
          border border-blue-100
          bg-white
          p-6
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="text-center py-12 pt-8">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Total Members */}
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border border-blue-100
            bg-white
            p-5
            shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-[5px_7px_0_rgba(37,99,235,0.13),0_12px_28px_rgba(15,23,42,0.10)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500">
                Total Members
              </div>

              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {stats.total}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Team members
              </div>
            </div>

            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 bg-slate-400 ring-slate-100" />
          </div>
        </div>

        {/* Managers */}
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border border-blue-100
            bg-white
            p-5
            shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-[5px_7px_0_rgba(37,99,235,0.13),0_12px_28px_rgba(15,23,42,0.10)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500">
                Managers
              </div>

              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {stats.managers}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Team managers
              </div>
            </div>

            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 bg-blue-600 ring-blue-100" />
          </div>
        </div>

        {/* Staff */}
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border border-blue-100
            bg-white
            p-5
            shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-[5px_7px_0_rgba(37,99,235,0.13),0_12px_28px_rgba(15,23,42,0.10)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500">
                Staff
              </div>

              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {stats.staff}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Staff members
              </div>
            </div>

            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 bg-emerald-500 ring-emerald-100" />
          </div>
        </div>

        {/* Active */}
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border border-blue-100
            bg-white
            p-5
            shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-[5px_7px_0_rgba(37,99,235,0.13),0_12px_28px_rgba(15,23,42,0.10)]
          "
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-500">
                Active
              </div>

              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {stats.active}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Active members
              </div>
            </div>

            <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 bg-emerald-500 ring-emerald-100" />
          </div>
        </div>

      </div>

      {/* Search & Filters */}
      <div
        className="
          relative overflow-hidden
          rounded-xl
          border border-blue-100
          bg-white
          p-4
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex flex-col md:flex-row gap-3 pt-1">

          <div className="flex-1 relative">
            <Search
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-slate-400
              "
              size={18}
            />

            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              className="
                w-full
                pl-10 pr-4 py-3
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-700
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-2
                focus:ring-blue-200
                focus:border-blue-300
                transition-all
              "
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            className="
              min-w-[150px]
              px-4 py-3
              rounded-xl
              border border-slate-200
              bg-white
              text-slate-700
              focus:outline-none
              focus:ring-2
              focus:ring-blue-200
              focus:border-blue-300
              transition-all
            "
          >
            <option value="all">
              All Roles
            </option>

            <option value="owner">
              Owner
            </option>

            <option value="manager">
              Manager
            </option>

            <option value="staff">
              Staff
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="
              min-w-[150px]
              px-4 py-3
              rounded-xl
              border border-slate-200
              bg-white
              text-slate-700
              focus:outline-none
              focus:ring-2
              focus:ring-blue-200
              focus:border-blue-300
              transition-all
            "
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="pending">
              Pending
            </option>
          </select>

        </div>
      </div>

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div
          className="
            relative overflow-hidden
            rounded-xl
            border-2 border-dashed
            border-slate-300
            bg-white
            p-16
            text-center
          "
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Users
              className="text-blue-600"
              size={40}
            />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            No Team Members Yet
          </h2>

          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Get started by inviting your first team member. Collaborate and manage your farm operations together.
          </p>

          {canInvite && (
            <button
              onClick={() =>
                onMemberSelect("")
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-6 py-3
                text-white
                font-semibold
                shadow-[3px_4px_0_rgba(30,64,175,0.18),0_6px_18px_rgba(15,23,42,0.08)]
                hover:bg-blue-700
                hover:-translate-y-0.5
                hover:shadow-[4px_6px_0_rgba(30,64,175,0.22),0_9px_22px_rgba(15,23,42,0.10)]
                transition-all duration-200
              "
            >
              <Plus size={20} />
              Invite Your First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMembers.map(
            (member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelected={
                  selectedMemberId ===
                  member.id
                }
                onClick={
                  onMemberSelect
                }
              />
            )
          )}
        </div>
      )}

    </div>
  );
}