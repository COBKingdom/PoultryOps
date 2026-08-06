"use client";

import React from "react";

import PermissionCheckbox from "./permission-checkbox";
import { PERMISSIONS, getPermissionsByCategory, getPermissionCategory } from "@/lib/permissions";

interface PermissionGroupProps {
  title: string;
  permissions: string[];
  userPermissions: Set<string>;
  onPermissionChange: (permission: string, checked: boolean) => void;
  disabled?: boolean;
}

export default function PermissionGroup({
  title,
  permissions,
  userPermissions,
  onPermissionChange,
  disabled = false,
}: PermissionGroupProps) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "Dashboard": "📊",
      "Flocks": "🐔",
      "Egg Production": "🥚",
      "Feed": "🌽",
      "Feed Inventory": "📦",
      "Health": "💉",
      "Mortality": "📉",
      "Sales": "💰",
      "Expenses": "💵",
      "Reports": "📈",
      "Analytics": "📊",
      "Migration": "🔄",
      "Team": "👥",
      "Settings": "⚙️",
      "Subscription": "📋",
      "Billing": "💳",
    };
    return icons[category] || "📌";
  };

  // Group permissions by CRUD actions
  const crudOrder = ["view", "create", "update", "delete", "export", "execute", "manage", "invite", "edit", "remove", "assign_roles"];
  const sortedPermissions = [...permissions].sort((a, b) => {
    const aAction = a.split(".")[1];
    const bAction = b.split(".")[1];
    const aIndex = crudOrder.indexOf(aAction);
    const bIndex = crudOrder.indexOf(bAction);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <div className="border border-slate-200 rounded-md p-2 bg-white">
      <h3 className="text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
        <span>{getCategoryIcon(title)}</span>
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
        {sortedPermissions.map((permission) => {
          const hasPermission = userPermissions.has(permission);
          return (
            <PermissionCheckbox
              key={permission}
              permission={permission}
              label={permission.split(".")[1].charAt(0).toUpperCase() + permission.split(".")[1].slice(1)}
              checked={hasPermission}
              onChange={onPermissionChange}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}