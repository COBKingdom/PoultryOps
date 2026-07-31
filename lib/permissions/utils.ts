/**
 * Permission Utilities
 * 
 * Helper functions for working with permissions.
 */

import { PERMISSIONS, PermissionCode, PERMISSION_CATEGORIES, PermissionCategory, ROLES, Role } from "./constants";

/**
 * Get permission category from permission code
 */
export function getPermissionCategory(permission: PermissionCode): PermissionCategory {
  const [category] = permission.split(".");
  // Convert snake_case to Title Case
  const formatted = category
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  return formatted as PermissionCategory;
}

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: PermissionCategory): PermissionCode[] {
  return Object.values(PERMISSIONS).filter(permission => {
    const permCategory = getPermissionCategory(permission);
    return permCategory === category;
  });
}

/**
 * Group permissions by category
 */
export function groupPermissionsByCategory(): Record<PermissionCategory, PermissionCode[]> {
  const grouped: Record<string, PermissionCode[]> = {};
  
  for (const permission of Object.values(PERMISSIONS)) {
    const category = getPermissionCategory(permission);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  }
  
  return grouped as Record<PermissionCategory, PermissionCode[]>;
}

/**
 * Check if a permission exists
 */
export function isValidPermission(permission: string): permission is PermissionCode {
  return Object.values(PERMISSIONS).includes(permission as PermissionCode);
}

/**
 * Validate permission array
 */
export function validatePermissions(permissions: string[]): PermissionCode[] {
  return permissions.filter(permission => isValidPermission(permission)) as PermissionCode[];
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: PermissionCode): string {
  const [action, subject] = permission.split(".");
  
  // Convert camelCase to Title Case
  const formattedAction = action
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  const formattedSubject = subject
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  return `${formattedAction} ${formattedSubject}`;
}

/**
 * Check if role is valid
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

/**
 * Normalize role (handle case-insensitive input)
 */
export function normalizeRole(role: string): Role | null {
  const normalized = role.toLowerCase();
  if (normalized === "owner") return ROLES.OWNER;
  if (normalized === "manager") return ROLES.MANAGER;
  if (normalized === "staff") return ROLES.STAFF;
  return null;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "staff":
      return "Staff";
    default:
      return role;
  }
}

/**
 * Check if role has elevated permissions
 */
export function hasElevatedPermissions(role: Role): boolean {
  return role === ROLES.OWNER || role === ROLES.MANAGER;
}

/**
 * Sort permissions by category then by code
 */
export function sortPermissions(permissions: PermissionCode[]): PermissionCode[] {
  return [...permissions].sort((a, b) => {
    const categoryA = getPermissionCategory(a);
    const categoryB = getPermissionCategory(b);
    
    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }
    
    return a.localeCompare(b);
  });
}

/**
 * Format permission for display
 */
export function formatPermissionForDisplay(permission: PermissionCode): {
  category: string;
  action: string;
  subject: string;
  full: string;
} {
  const [action, subject] = permission.split(".");
  
  return {
    category: getPermissionCategory(permission),
    action: action.charAt(0).toUpperCase() + action.slice(1),
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    full: getPermissionDisplayName(permission),
  };
}