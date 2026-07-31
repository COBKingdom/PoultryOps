"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { User, Mail, Shield, Calendar } from "lucide-react";

import MemberStatusBadge from "./member-status-badge";

type Props = {
  member: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: "active" | "inactive" | "pending";
    created_at: string;
    last_sign_in_at?: string;
  };
  isSelected: boolean;
  onClick: (id: string) => void;
};

export default function MemberCard({ member, isSelected, onClick }: Props) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {member.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {member.full_name}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Mail size={14} />
              {member.email}
            </p>
          </div>
        </div>
      </div>

      {/* Role & Status */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${getRoleColor(member.role)}`}>
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </span>
        <MemberStatusBadge status={member.status} />
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
            router.push(`/team/${member.id}`);
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