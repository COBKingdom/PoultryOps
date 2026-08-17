/**
 * PoultryOps Permission Constants
 *
 * Centralized permission registry for the entire application.
 * No permission strings should appear anywhere else in the codebase.
 *
 * IMPORTANT:
 * These permission codes MUST remain identical to the values stored in the
 * Supabase `permissions` table.
 *
 * Standard CRUD naming:
 *   view
 *   create
 *   edit
 *   delete
 *
 * Do NOT use ".update" anywhere in the application.
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_EXPORT: "dashboard.export",

  // Flocks
  FLOCKS_VIEW: "flocks.view",
  FLOCKS_CREATE: "flocks.create",
  FLOCKS_EDIT: "flocks.edit",
  FLOCKS_DELETE: "flocks.delete",
  FLOCKS_ARCHIVE: "flocks.archive",

  // Eggs
  EGGS_VIEW: "eggs.view",
  EGGS_CREATE: "eggs.create",
  EGGS_EDIT: "eggs.edit",
  EGGS_DELETE: "eggs.delete",

  // Feed
  FEED_VIEW: "feed.view",
  FEED_CREATE: "feed.create",
  FEED_EDIT: "feed.edit",
  FEED_DELETE: "feed.delete",

  // Feed Inventory
  FEED_INVENTORY_VIEW: "feed_inventory.view",
  FEED_INVENTORY_CREATE: "feed_inventory.create",
  FEED_INVENTORY_EDIT: "feed_inventory.edit",
  FEED_INVENTORY_DELETE: "feed_inventory.delete",

  // Health
  HEALTH_VIEW: "health.view",
  HEALTH_CREATE: "health.create",
  HEALTH_EDIT: "health.edit",
  HEALTH_DELETE: "health.delete",

  // Mortality
  MORTALITY_VIEW: "mortality.view",
  MORTALITY_CREATE: "mortality.create",
  MORTALITY_EDIT: "mortality.edit",
  MORTALITY_DELETE: "mortality.delete",

  // Isolation
  ISOLATION_VIEW: "isolation.view",
  ISOLATION_CREATE: "isolation.create",
  ISOLATION_EDIT: "isolation.edit",
  ISOLATION_DELETE: "isolation.delete",

  // Sales
  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  SALES_EDIT: "sales.edit",
  SALES_DELETE: "sales.delete",

  // Expenses
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_EDIT: "expenses.edit",
  EXPENSES_DELETE: "expenses.delete",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",

  // Migration
  MIGRATION_VIEW: "migration.view",
  MIGRATION_EXECUTE: "migration.execute",
  MIGRATION_MANAGE: "migration.manage",

  // Team
  TEAM_VIEW: "team.view",
  TEAM_INVITE: "team.invite",
  TEAM_EDIT: "team.edit",
  TEAM_REMOVE: "team.remove",
  TEAM_ASSIGN_ROLES: "team.assign_roles",

  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
  SETTINGS_MANAGE_USERS: "settings.manage_users",

  // Subscription
  SUBSCRIPTION_VIEW: "subscription.view",
  SUBSCRIPTION_MANAGE: "subscription.manage",

  // Billing
  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",
  BILLING_EXPORT: "billing.export",
} as const;

/**
 * Type definition for permission codes
 */
export type PermissionCode =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Array of all permission codes
 */
export const ALL_PERMISSIONS =
  Object.values(PERMISSIONS);

/**
 * Permission categories
 */
export const PERMISSION_CATEGORIES = [
  "Dashboard",
  "Flocks",
  "Eggs",
  "Feed",
  "Feed Inventory",
  "Health",
  "Mortality",
  "Isolation",
  "Sales",
  "Expenses",
  "Reports",
  "Analytics",
  "Migration",
  "Team",
  "Settings",
  "Subscription",
  "Billing",
] as const;

export type PermissionCategory =
  typeof PERMISSION_CATEGORIES[number];

/**
 * System Roles
 */
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type Role =
  typeof ROLES[keyof typeof ROLES];

/**
 * Database Role Templates
 */
export const SYSTEM_ROLES = {
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type SystemRole =
  typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];