/**
 * PoultryOps Permission Engine - Client Exports
 * 
 * This module exports only client-safe permission utilities.
 * Server-side code should import from the specific modules directly:
 * - lib/permissions/api (for API route helpers)
 * - lib/permissions/cache (for permission caching)
 * - lib/permissions/service (for permission service)
 * 
 * Features:
 * - Database-driven permissions
 * - Role-based access control (RBAC)
 * - Type-safe permission checking
 * - React hooks and components
 * 
 * Usage:
 * ```typescript
 * import { 
 *   PERMISSIONS, 
 *   usePermissions, 
 *   PermissionGuard 
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
 * ```
 * 
 * For API routes:
 * ```typescript
 * import { requirePermission } from '@/lib/permissions/api';
 * import { PERMISSIONS } from '@/lib/permissions';
 * ```
 */

// Constants (client-safe)
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

// Provider (client-safe - React component)
export {
  PermissionProvider,
  usePermissions,
} from "./provider";

// Guards (client-safe - React components)
export {
  PermissionGuard,
  AnyPermissionGuard,
  AllPermissionGuard,
  PagePermission,
  OwnerOnly,
} from "./guards";

// Utilities (client-safe - pure functions)
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

/**
 * SERVER-SIDE IMPORTS
 * 
 * For API routes and server utilities, import directly from these modules:
 * 
 * // API route helpers (uses supabaseAdmin)
 * import { requirePermission } from '@/lib/permissions/api';
 * 
 * // Permission cache (uses supabaseAdmin)
 * import { permissionCache } from '@/lib/permissions/cache';
 * 
 * // Permission service (uses cache)
 * import { permissionService } from '@/lib/permissions/service';
 * 
 * // Constants
 * import { PERMISSIONS, ROLES } from '@/lib/permissions';
 */
