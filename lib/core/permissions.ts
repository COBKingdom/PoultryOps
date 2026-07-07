import { UserRole } from "./roles";

export type Permission =
  | "dashboard.view"
  | "reports.view"
  | "eggs.manage"
  | "feed.manage"
  | "health.manage"
  | "mortality.manage"
  | "sales.manage"
  | "expenses.manage"
  | "users.manage"
  | "settings.manage"
  | "subscription.manage"
  | "billing.manage"
  | "audit.view"
  | "import.data"
  | "export.data";

const rolePermissions: Record<
  UserRole,
  Permission[]
> = {
  owner: [
    "dashboard.view",
    "reports.view",
    "eggs.manage",
    "feed.manage",
    "health.manage",
    "mortality.manage",
    "sales.manage",
    "expenses.manage",
    "users.manage",
    "settings.manage",
    "subscription.manage",
    "billing.manage",
    "audit.view",
    "import.data",
    "export.data",
  ],

  manager: [
    "dashboard.view",
    "reports.view",
    "eggs.manage",
    "feed.manage",
    "health.manage",
    "mortality.manage",
    "sales.manage",
    "expenses.manage",
  ],

  staff: [
    "dashboard.view",
    "eggs.manage",
    "feed.manage",
    "health.manage",
    "mortality.manage",
    "sales.manage",
    "expenses.manage",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
) {
  return rolePermissions[
    role
  ]?.includes(permission);
}