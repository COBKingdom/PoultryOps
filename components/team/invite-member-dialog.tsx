"use client";

import React, { useState, useEffect } from "react";

import { X, Mail, UserPlus } from "lucide-react";

import RoleSelector from "./role-selector";
import PermissionGroup from "./permission-group";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS, ROLES, ALL_PERMISSIONS } from "@/lib/permissions";
import { groupPermissionsByCategory } from "@/lib/permissions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  onSuccess: () => void;
};

type FormData = {
  full_name: string;
  email: string;
  role: string;
  permissions: Set<string>;
};

export default function InviteMemberDialog({ isOpen, onClose, farmId, onSuccess }: Props) {
  const { can } = usePermissions();
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    role: ROLES.STAFF,
    permissions: new Set(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissionsByCategory = groupPermissionsByCategory();
  const canManageUsers = can(PERMISSIONS.SETTINGS_MANAGE_USERS);

  // Load default permissions when role changes
  useEffect(() => {
    // Define role-based permission templates
    const getDefaultPermissions = (roleValue: string): Set<string> => {
      switch (roleValue) {
        case ROLES.MANAGER:
          // Manager: Full operational access + team management + reports
          return new Set([
            // Dashboard
            PERMISSIONS.DASHBOARD_VIEW,
            // Flocks
            PERMISSIONS.FLOCKS_VIEW,
            PERMISSIONS.FLOCKS_CREATE,
            PERMISSIONS.FLOCKS_UPDATE,
            PERMISSIONS.FLOCKS_DELETE,
            PERMISSIONS.FLOCKS_ARCHIVE,
            // Egg Production
            PERMISSIONS.EGG_PRODUCTION_VIEW,
            PERMISSIONS.EGG_PRODUCTION_CREATE,
            PERMISSIONS.EGG_PRODUCTION_UPDATE,
            PERMISSIONS.EGG_PRODUCTION_DELETE,
            // Feed
            PERMISSIONS.FEED_VIEW,
            PERMISSIONS.FEED_CREATE,
            PERMISSIONS.FEED_UPDATE,
            PERMISSIONS.FEED_DELETE,
            // Feed Inventory
            PERMISSIONS.FEED_INVENTORY_VIEW,
            PERMISSIONS.FEED_INVENTORY_CREATE,
            PERMISSIONS.FEED_INVENTORY_UPDATE,
            PERMISSIONS.FEED_INVENTORY_DELETE,
            // Health
            PERMISSIONS.HEALTH_VIEW,
            PERMISSIONS.HEALTH_CREATE,
            PERMISSIONS.HEALTH_UPDATE,
            PERMISSIONS.HEALTH_DELETE,
            // Mortality
            PERMISSIONS.MORTALITY_VIEW,
            PERMISSIONS.MORTALITY_CREATE,
            PERMISSIONS.MORTALITY_UPDATE,
            PERMISSIONS.MORTALITY_DELETE,
            // Sales
            PERMISSIONS.SALES_VIEW,
            PERMISSIONS.SALES_CREATE,
            PERMISSIONS.SALES_UPDATE,
            PERMISSIONS.SALES_DELETE,
            // Expenses
            PERMISSIONS.EXPENSES_VIEW,
            PERMISSIONS.EXPENSES_CREATE,
            PERMISSIONS.EXPENSES_UPDATE,
            PERMISSIONS.EXPENSES_DELETE,
            // Reports
            PERMISSIONS.REPORTS_VIEW,
            PERMISSIONS.REPORTS_EXPORT,
            // Analytics
            PERMISSIONS.ANALYTICS_VIEW,
            PERMISSIONS.ANALYTICS_EXPORT,
            // Team
            PERMISSIONS.TEAM_VIEW,
            PERMISSIONS.TEAM_INVITE,
            PERMISSIONS.TEAM_EDIT,
            // Settings
            PERMISSIONS.SETTINGS_VIEW,
            PERMISSIONS.SETTINGS_EDIT,
          ]);
        
        case ROLES.STAFF:
          // Staff: Limited operational access (view, create, update - no delete)
          return new Set([
            // Dashboard
            PERMISSIONS.DASHBOARD_VIEW,
            // Flocks
            PERMISSIONS.FLOCKS_VIEW,
            PERMISSIONS.FLOCKS_CREATE,
            PERMISSIONS.FLOCKS_UPDATE,
            // Egg Production
            PERMISSIONS.EGG_PRODUCTION_VIEW,
            PERMISSIONS.EGG_PRODUCTION_CREATE,
            PERMISSIONS.EGG_PRODUCTION_UPDATE,
            // Feed
            PERMISSIONS.FEED_VIEW,
            PERMISSIONS.FEED_CREATE,
            PERMISSIONS.FEED_UPDATE,
            // Feed Inventory
            PERMISSIONS.FEED_INVENTORY_VIEW,
            PERMISSIONS.FEED_INVENTORY_CREATE,
            PERMISSIONS.FEED_INVENTORY_UPDATE,
            // Health
            PERMISSIONS.HEALTH_VIEW,
            PERMISSIONS.HEALTH_CREATE,
            PERMISSIONS.HEALTH_UPDATE,
            // Mortality
            PERMISSIONS.MORTALITY_VIEW,
            PERMISSIONS.MORTALITY_CREATE,
            PERMISSIONS.MORTALITY_UPDATE,
            // Sales
            PERMISSIONS.SALES_VIEW,
            PERMISSIONS.SALES_CREATE,
            PERMISSIONS.SALES_UPDATE,
            // Expenses
            PERMISSIONS.EXPENSES_VIEW,
            PERMISSIONS.EXPENSES_CREATE,
            PERMISSIONS.EXPENSES_UPDATE,
          ]);
        
        default:
          return new Set();
      }
    };

    setFormData(prev => ({
      ...prev,
      permissions: getDefaultPermissions(formData.role),
    }));
  }, [formData.role]);

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = new Set(prev.permissions);
      if (checked) {
        newPermissions.add(permission);
      } else {
        newPermissions.delete(permission);
      }
      return {
        ...prev,
        permissions: newPermissions,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement actual API call
      console.log("Inviting member:", {
        farmId,
        ...formData,
        permissions: Array.from(formData.permissions),
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        role: ROLES.STAFF,
        permissions: new Set(),
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      full_name: "",
      email: "",
      role: ROLES.STAFF,
      permissions: new Set(),
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Invite Team Member</h2>
            <p className="text-sm text-slate-500 mt-1">
              Add a new member to your team and configure their permissions
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Role Selection */}
            <RoleSelector
              value={formData.role}
              onChange={handleRoleChange}
              disabled={!canManageUsers}
            />

            {/* Permissions */}
            {canManageUsers && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Permissions
                </label>
                
                {/* Help Banner */}
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Selecting a role automatically applies recommended permissions. You can customize them before sending the invitation.
                  </p>
                </div>

                {/* Role Summary */}
                <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700">
                    {formData.role === ROLES.MANAGER ? "Manager" : formData.role === ROLES.STAFF ? "Staff" : "Custom"} • {formData.permissions.size} permission{formData.permissions.size !== 1 ? 's' : ''} selected
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <PermissionGroup
                      key={category}
                      title={category}
                      permissions={permissions}
                      userPermissions={formData.permissions}
                      onPermissionChange={handlePermissionChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            {loading ? "Inviting..." : "Send Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}