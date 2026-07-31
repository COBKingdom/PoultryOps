/**
 * PoultryOps Permission Constants
 * 
 * Centralized permission registry for the entire application.
 * No permission strings should appear anywhere else in the codebase.
 * 
 * This module is designed to be reusable across all TrueOps applications
 * (AquaOps, StayOps, BakeryOps, etc.)
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  DASHBOARD_EXPORT: "dashboard.export",

  // Flocks
  FLOCKS_VIEW: "flocks.view",
  FLOCKS_CREATE: "flocks.create",
  FLOCKS_UPDATE: "flocks.update",
  FLOCKS_DELETE: "flocks.delete",
  FLOCKS_ARCHIVE: "flocks.archive",

  // Egg Production
  EGG_PRODUCTION_VIEW: "egg_production.view",
  EGG_PRODUCTION_CREATE: "egg_production.create",
  EGG_PRODUCTION_UPDATE: "egg_production.update",
  EGG_PRODUCTION_DELETE: "egg_production.delete",

  // Feed
  FEED_VIEW: "feed.view",
  FEED_CREATE: "feed.create",
  FEED_UPDATE: "feed.update",
  FEED_DELETE: "feed.delete",

  // Feed Inventory
  FEED_INVENTORY_VIEW: "feed_inventory.view",
  FEED_INVENTORY_CREATE: "feed_inventory.create",
  FEED_INVENTORY_UPDATE: "feed_inventory.update",
  FEED_INVENTORY_DELETE: "feed_inventory.delete",

  // Health
  HEALTH_VIEW: "health.view",
  HEALTH_CREATE: "health.create",
  HEALTH_UPDATE: "health.update",
  HEALTH_DELETE: "health.delete",

  // Mortality
  MORTALITY_VIEW: "mortality.view",
  MORTALITY_CREATE: "mortality.create",
  MORTALITY_UPDATE: "mortality.update",
  MORTALITY_DELETE: "mortality.delete",

  // Sales
  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",

  // Expenses
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_UPDATE: "expenses.update",
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
export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Array of all permission codes for iteration
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Permission categories for grouping
 */
export const PERMISSION_CATEGORIES = [
  "Dashboard",
  "Flocks",
  "Egg Production",
  "Feed",
  "Feed Inventory",
  "Health",
  "Mortality",
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

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

/**
 * Role definitions
 */
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * System role templates (from database)
 */
export const SYSTEM_ROLES = {
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];