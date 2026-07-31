/**
 * Permission Service
 * 
 * Main service for permission checking and management.
 * This is the single source of truth for all permission operations.
 * 
 * Features:
 * - O(1) permission checks via caching
 * - Owner automatically has all permissions
 * - Graceful error handling
 * - Type-safe permission checking
 */

import { permissionCache } from "./cache";
import { ALL_PERMISSIONS, PermissionCode, ROLES, Role } from "./constants";

export interface PermissionState {
  userId: string | null;
  role: Role | null;
  loading: boolean;
  error: Error | null;
}

export interface PermissionServiceResult {
  success: boolean;
  error?: Error;
}

/**
 * Permission Service
 * Provides methods for checking and managing permissions
 */
export class PermissionService {
  private static instance: PermissionService;
  private state: PermissionState = {
    userId: null,
    role: null,
    loading: false,
    error: null,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Initialize permission service with user data
   */
  async initialize(userId: string, role: Role): Promise<void> {
    this.state = {
      userId,
      role,
      loading: true,
      error: null,
    };

    try {
      await permissionCache.loadPermissions(userId, role);
    } catch (error) {
      this.state.error = error instanceof Error ? error : new Error("Failed to load permissions");
      console.error("Permission service initialization error:", error);
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Check if current user has a specific permission
   */
  can(permission: PermissionCode): boolean {
    if (!this.state.userId || !this.state.role) {
      return false;
    }

    const cached = permissionCache.get(this.state.userId);
    if (!cached) {
      // If not cached, owner still has all permissions
      if (this.state.role === ROLES.OWNER) {
        return true;
      }
      return false;
    }

    return permissionCache.hasPermission(cached, permission);
  }

  /**
   * Check if current user has any of the specified permissions
   */
  canAny(permissions: PermissionCode[]): boolean {
    if (!this.state.userId || !this.state.role) {
      return false;
    }

    const cached = permissionCache.get(this.state.userId);
    if (!cached) {
      // If not cached, owner still has all permissions
      if (this.state.role === ROLES.OWNER) {
        return true;
      }
      return false;
    }

    return permissionCache.hasAnyPermission(cached, permissions);
  }

  /**
   * Check if current user has all of the specified permissions
   */
  canAll(permissions: PermissionCode[]): boolean {
    if (!this.state.userId || !this.state.role) {
      return false;
    }

    const cached = permissionCache.get(this.state.userId);
    if (!cached) {
      // If not cached, owner still has all permissions
      if (this.state.role === ROLES.OWNER) {
        return true;
      }
      return false;
    }

    return permissionCache.hasAllPermissions(cached, permissions);
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: Role): boolean {
    return this.state.role === role;
  }

  /**
   * Check if current user is owner
   */
  isOwner(): boolean {
    return this.state.role === ROLES.OWNER;
  }

  /**
   * Check if current user is manager or higher (owner)
   */
  isManagerOrHigher(): boolean {
    return this.state.role === ROLES.OWNER || this.state.role === ROLES.MANAGER;
  }

  /**
   * Check if current user is staff or higher (owner, manager)
   */
  isStaffOrHigher(): boolean {
    return (
      this.state.role === ROLES.OWNER ||
      this.state.role === ROLES.MANAGER ||
      this.state.role === ROLES.STAFF
    );
  }

  /**
   * Refresh permissions from database
   */
  async refreshPermissions(): Promise<void> {
    if (!this.state.userId || !this.state.role) {
      return;
    }

    try {
      this.state.loading = true;
      await permissionCache.refreshPermissions(this.state.userId, this.state.role);
    } catch (error) {
      console.error("Error refreshing permissions:", error);
      this.state.error = error instanceof Error ? error : new Error("Failed to refresh permissions");
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Get current permission state
   */
  getState(): PermissionState {
    return { ...this.state };
  }

  /**
   * Get all permissions for current user
   */
  getPermissions(): PermissionCode[] {
    if (!this.state.userId || !this.state.role) {
      return [];
    }

    const cached = permissionCache.get(this.state.userId);
    if (!cached) {
      // If not cached, owner has all permissions
      if (this.state.role === ROLES.OWNER) {
        return [...ALL_PERMISSIONS];
      }
      return [];
    }

    return Array.from(cached.permissions);
  }

  /**
   * Check if permissions are loading
   */
  isLoading(): boolean {
    return this.state.loading;
  }

  /**
   * Get current error if any
   */
  getError(): Error | null {
    return this.state.error;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }

  /**
   * Reset service state (for logout)
   */
  reset(): void {
    this.state = {
      userId: null,
      role: null,
      loading: false,
      error: null,
    };
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();