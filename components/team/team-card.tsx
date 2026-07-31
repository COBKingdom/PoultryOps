"use client";

import React, { useState, useMemo } from "react";

import { Users, Search, Filter, Shield, UserCheck, Plus } from "lucide-react";

import MemberCard from "./member-card";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

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
  status: "active" | "inactive" | "pending";
  created_at: string;
  last_sign_in_at?: string;
};

export default function TeamCard({ farmId, onMemberSelect, selectedMemberId }: Props) {
  const { can } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canInvite = can(PERMISSIONS.TEAM_INVITE);
  const canEdit = can(PERMISSIONS.TEAM_EDIT);

  // Mock data for now - will be replaced with actual API call
  React.useEffect(() => {
    // TODO: Replace with actual API call
    const mockMembers: Member[] = [
      {
        id: "1",
        full_name: "Farm Owner",
        email: "owner@farm.com",
        role: "owner",
        status: "active",
        created_at: "2024-01-01",
        last_sign_in_at: new Date().toISOString(),
      },
    ];

    setMembers(mockMembers);
    setLoading(false);
  }, [farmId]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const managers = members.filter((m) => m.role === "manager").length;
    const staff = members.filter((m) => m.role === "staff").length;
    const active = members.filter((m) => m.status === "active").length;

    return { total, managers, staff, active };
  }, [members]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-slate-600" size={18} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Members
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-blue-600" size={18} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Managers
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.managers}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-green-600" size={18} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Staff
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.staff}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="text-green-600" size={18} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Active
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Users className="text-blue-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            No Team Members Yet
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Get started by inviting your first team member. Collaborate and manage your farm operations together.
          </p>
          {canInvite && (
            <button
              onClick={() => onMemberSelect("")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all"
            >
              <Plus size={20} />
              Invite Your First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isSelected={selectedMemberId === member.id}
              onClick={onMemberSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

