/**
 * PoultryOps Permission Engine
 * 
 * Enterprise-grade permission system for PoultryOps and future TrueOps applications.
 * This module provides a centralized, type-safe permission management system.
 * 
 * Features:
 * - Database-driven permissions
 * - Role-based access control (RBAC)
 * - Permission caching for performance
 * - Type-safe permission checking
 * - React hooks and components
 * - API authorization helpers
 * 
 * Usage:
 * ```typescript
 * import { 
 *   PERMISSIONS, 
 *   usePermissions, 
 *   PermissionGuard,
 *   requirePermission 
 * } from '@/lib/permissions';
 * 
 * // In component
 * const { can } = usePermissions();
 * if (can(PERMISSIONS.SALES_CREATE)) {
 *   // User can create sales
 * }
 * 
 * // In JSX
 * <PermissionGuard permission={PERMISSIONS.SALES_CREATE}>
 *   <Button>Create Sale</Button>
 * </PermissionGuard>
 * 
 * // In API route
 * const result = await requirePermission(PERMISSIONS.SALES_CREATE, request);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: result.statusCode });
 * }
 * ```
 */

// Constants
export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLES,
  SYSTEM_ROLES,
  type PermissionCode,
  type PermissionCategory,
  type Role,
  type SystemRole,
} from "./constants";

// Cache
export {
  permissionCache,
  type CachedPermissions,
} from "./cache";

// Service
export {
  permissionService,
  type PermissionState,
  type PermissionServiceResult,
} from "./service";

// Provider
export {
  PermissionProvider,
  usePermissions,
} from "./provider";

// Guards
export {
  PermissionGuard,
  AnyPermissionGuard,
  AllPermissionGuard,
  PagePermission,
  OwnerOnly,
} from "./guards";

// API Helpers
export {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwner,
  type ApiPermissionResult,
} from "./api";

// Utilities
export {
  getPermissionCategory,
  getPermissionsByCategory,
  groupPermissionsByCategory,
  isValidPermission,
  validatePermissions,
  getPermissionDisplayName,
  isValidRole,
  normalizeRole,
  getRoleDisplayName,
  hasElevatedPermissions,
  sortPermissions,
  formatPermissionForDisplay,
} from "./utils";