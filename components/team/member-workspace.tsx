"use client";

import React, { useState, useEffect } from "react";

import { X, UserCheck, UserX, Shield, Mail, Calendar, Key, Trash2, AlertTriangle } from "lucide-react";

import PermissionGroup from "./permission-group";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions";
import { groupPermissionsByCategory } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

type Props = {
  memberId: string;
  onClose: () => void;
};

type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: "active" | "inactive" | "pending" | null;
  created_at: string | null;
  last_sign_in_at?: string | null;
  permissions: string[];
};

export default function MemberWorkspace({ memberId, onClose }: Props) {
  const { can } = usePermissions();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = can(PERMISSIONS.TEAM_EDIT);
  const canManageUsers = can(PERMISSIONS.SETTINGS_MANAGE_USERS);

  const permissionsByCategory = groupPermissionsByCategory();

  // Load member data from API
  useEffect(() => {
    async function loadMember() {
      try {
        setLoading(true);
        
        // Get the current session to include JWT in Authorization header
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch(`/api/team/${memberId}`, {
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load member details`);
        }

        const data = await response.json();
        const memberData = data.member;
        
        // Get member permissions
        const permResponse = await fetch(`/api/permissions?userId=${memberId}`, {
          headers,
        });
        
        let userPermissions: string[] = [];
        if (permResponse.ok) {
          const permData = await permResponse.json();
          userPermissions = permData.permissions || [];
        }
        
        setMember({
          id: memberData.id,
          full_name: memberData.full_name,
          email: memberData.email,
          role: memberData.role,
          status: memberData.status || "active",
          created_at: memberData.created_at,
          last_sign_in_at: memberData.last_sign_in_at,
          permissions: userPermissions,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load member details";
        console.error("Error loading member:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  const handlePermissionChange = async (permission: string, checked: boolean) => {
    if (!member || !canEdit) return;

    setSaving(true);
    try {
      // Get the current session to include JWT in Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Save explicit override
      const response = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          permissions: [
            { code: permission, granted: checked }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update permission");
      }

      // Update local state
      setMember(prev => {
        if (!prev) return prev;
        const newPermissions = checked
          ? [...prev.permissions, permission]
          : prev.permissions.filter(p => p !== permission);
        return { ...prev, permissions: newPermissions };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permission");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!member || !canEdit) return;

    setSaving(true);
    try {
      // TODO: Implement actual API call
      console.log("Toggling status:", {
        userId: member.id,
        newStatus: member.status === "active" ? "inactive" : "active",
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setMember(prev => prev ? { ...prev, status: prev.status === "active" ? "inactive" : "active" } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!member) return;

    setDeleting(true);
    setError(null);
    try {
      // Get the current session to include JWT in Authorization header
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/team/${member.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete member");
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error || "Member not found"}</p>
        </div>
      </div>
    );
  }

  const isOwner = member.role === "owner";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {(member.full_name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {member.full_name ?? (isOwner ? "Farm Owner" : "Unknown User")}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Mail size={12} />
              {member.email ?? "no-email@example.com"}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                isOwner ? "bg-purple-100 text-purple-700 border-purple-200" :
                member.role === "manager" ? "bg-blue-100 text-blue-700 border-blue-200" :
                "bg-green-100 text-green-700 border-green-200"
              }`}>
                {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Unknown"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                member.status === "active" ? "bg-green-100 text-green-700 border-green-200" :
                member.status === "inactive" ? "bg-slate-100 text-slate-700 border-slate-200" :
                "bg-amber-100 text-amber-700 border-amber-200"
              }`}>
                {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Overview Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Overview</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <Mail size={12} />
                <p className="text-xs font-medium">Email</p>
              </div>
              <p className="text-xs font-medium text-slate-900 truncate">{member.email ?? "no-email@example.com"}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <Shield size={12} />
                <p className="text-xs font-medium">Role</p>
              </div>
              <p className="text-xs font-medium text-slate-900 capitalize">{member.role ?? "unknown"}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <Calendar size={12} />
                <p className="text-xs font-medium">Joined</p>
              </div>
              <p className="text-xs font-medium text-slate-900">{formatDate(member.created_at)}</p>
            </div>

            {member.last_sign_in_at && (
              <div className="bg-slate-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <Key size={12} />
                  <p className="text-xs font-medium">Last Login</p>
                </div>
                <p className="text-xs font-medium text-slate-900">{formatDate(member.last_sign_in_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        {!isOwner && canManageUsers && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Security</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleStatus}
                disabled={saving}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${member.status === "active"
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {member.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                {member.status === "active" ? "Deactivate" : "Reactivate"}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                Delete Member
              </button>
            </div>
          </div>
        )}

        {/* Delete Member Confirmation */}
        {showDeleteConfirm && member && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete {member.full_name ?? "this member"}?
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-sm text-slate-700">
                  The member will be permanently removed and will no longer be able to access the farm. Their account will be deleted, along with all associated application records.
                </p>
                <p className="text-sm text-slate-500">
                  Farm and business operational data will not be deleted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Section */}
        {canManageUsers && !isOwner && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Permissions</h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                return (
                  <PermissionGroup
                    key={category}
                    title={category}
                    permissions={permissions}
                    userPermissions={new Set(member.permissions)}
                    onPermissionChange={handlePermissionChange}
                    disabled={!canEdit || saving}
                  />
                );
              })}
            </div>
          </div>
        )}

        {isOwner && (
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-xs text-purple-700">
              Owner has all permissions automatically. Cannot be modified.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}