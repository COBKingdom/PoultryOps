"use client";

import { useAccess } from "./useAccess";

import {
  hasPermission,
  Permission,
} from "@/lib/core/permissions";

export function usePermissions() {
  const {
    role,
  } = useAccess();

  function can(
    permission: Permission
  ) {
    if (!role) {
      return false;
    }

    return hasPermission(
      role as any,
      permission
    );
  }

  return {
    role,

    can,

    canViewDashboard:
      can(
        "dashboard.view"
      ),

    canViewReports:
      can(
        "reports.view"
      ),

    canManageUsers:
      can(
        "users.manage"
      ),

    canManageSettings:
      can(
        "settings.manage"
      ),

    canManageBilling:
      can(
        "billing.manage"
      ),

    canManageSubscription:
      can(
        "subscription.manage"
      ),

    canViewAudit:
      can(
        "audit.view"
      ),

    canImportData:
      can(
        "import.data"
      ),

    canExportData:
      can(
        "export.data"
      ),
  };
}