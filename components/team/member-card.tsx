"use client";

import React from "react";

import { User, Mail, Shield, Calendar } from "lucide-react";

import MemberStatusBadge from "./member-status-badge";

type Props = {
  member: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    status: "active" | "inactive" | "pending" | null;
    created_at: string | null;
    last_sign_in_at?: string | null;
  };
  isSelected: boolean;
  onClick: (id: string) => void;
};

export default function MemberCard({ member, isSelected, onClick }: Props) {
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string | null | undefined) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "staff":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      onClick={() => onClick(member.id)}
      className={`
        group relative bg-white rounded-2xl border p-6 shadow-sm cursor-pointer
        transition-all duration-200 hover:shadow-xl hover:-translate-y-1
        ${isSelected
          ? "border-blue-500 shadow-md ring-2 ring-blue-500 ring-opacity-20"
          : "border-slate-200"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {getInitials(member.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {member.full_name ?? (member.role === "owner" ? "Farm Owner" : "Unknown User")}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
              <Mail size={14} className="flex-shrink-0" />
              <span className="truncate">{member.email ?? "no-email@example.com"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Role & Status */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${getRoleColor(member.role)}`}>
          {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Unknown"}
        </span>
        <MemberStatusBadge status={member.status ?? "active"} />
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span>Joined {formatDate(member.created_at)}</span>
        </div>
        {member.last_sign_in_at && (
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-slate-400" />
            <span>Last login {formatDate(member.last_sign_in_at)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(member.id);
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <User size={14} />
          View Details
        </button>
      </div>
    </div>
  );
}