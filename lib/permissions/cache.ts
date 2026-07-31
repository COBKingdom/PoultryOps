/**
 * Permission Cache
 * 
 * Provides efficient caching for user permissions to minimize database queries.
 * Permissions are loaded once after login and cached for the session.
 */

import { supabase } from "@/lib/supabase";
import { PERMISSIONS, ALL_PERMISSIONS, PermissionCode, ROLES, Role } from "./constants";

export interface CachedPermissions {
  userId: string;
  role: Role;
  permissions: Set<PermissionCode>;
  loadedAt: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "permission_cache";

class PermissionCache {
  private cache: Map<string, CachedPermissions> = new Map();
  private loadingPromises: Map<string, Promise<CachedPermissions>> = new Map();

  /**
   * Get cached permissions for a user
   */
  get(userId: string): CachedPermissions | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Set cached permissions for a user
   */
  set(userId: string, data: Omit<CachedPermissions, "loadedAt" | "expiresAt">): void {
    const now = Date.now();
    this.cache.set(userId, {
      ...data,
      loadedAt: now,
      expiresAt: now + CACHE_DURATION,
    });
  }

  /**
   * Invalidate cache for a user
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
    this.loadingPromises.delete(userId);
  }

  /**
   * Invalidate all cached permissions
   */
  invalidateAll(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Load permissions from database
   */
  async loadPermissions(userId: string, role: Role): Promise<CachedPermissions> {
    // Return cached version if available
    const cached = this.get(userId);
    if (cached) {
      return cached;
    }

    // Prevent duplicate requests
    const existingPromise = this.loadingPromises.get(userId);
    if (existingPromise) {
      return existingPromise;
    }

    // Load permissions
    const loadPromise = this._fetchPermissionsFromDb(userId, role);
    this.loadingPromises.set(userId, loadPromise);

    try {
      const result = await loadPromise;
      this.set(userId, result);
      return result;
    } finally {
      this.loadingPromises.delete(userId);
    }
  }

  /**
   * Refresh permissions from database
   */
  async refreshPermissions(userId: string, role: Role): Promise<CachedPermissions> {
    this.invalidate(userId);
    return this.loadPermissions(userId, role);
  }

  /**
   * Fetch permissions from database
   */
  private async _fetchPermissionsFromDb(userId: string, role: Role): Promise<CachedPermissions> {
    // Owner has all permissions
    if (role === ROLES.OWNER) {
      return {
        userId,
        role,
        permissions: new Set(ALL_PERMISSIONS),
        loadedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
    }

    try {
      // Fetch user permissions from database
      const { data: userPermissions, error } = await supabase
        .from("user_permissions")
        .select(`
          granted,
          permission:permissions(code)
        `)
        .eq("user_id", userId)
        .eq("granted", true);

      if (error) {
        console.error("Error fetching user permissions:", error);
        // Return empty set on error - fail gracefully
        return {
          userId,
          role,
          permissions: new Set<PermissionCode>(),
          loadedAt: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION,
        };
      }

      // Extract permission codes
      const permissionCodes = new Set<PermissionCode>();
      
      if (userPermissions) {
        for (const up of userPermissions) {
          if (up.permission && typeof up.permission === 'object' && 'code' in up.permission) {
            const code = (up.permission as any).code as PermissionCode;
            if (code) {
              permissionCodes.add(code);
            }
          }
        }
      }

      return {
        userId,
        role,
        permissions: permissionCodes,
        loadedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
    } catch (error) {
      console.error("Unexpected error loading permissions:", error);
      // Return empty set on error - fail gracefully
      return {
        userId,
        role,
        permissions: new Set<PermissionCode>(),
        loadedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
    }
  }

  /**
   * Check if user has a specific permission (from cache)
   */
  hasPermission(cached: CachedPermissions, permission: PermissionCode): boolean {
    // Owner always has all permissions
    if (cached.role === ROLES.OWNER) {
      return true;
    }

    return cached.permissions.has(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(cached: CachedPermissions, permissions: PermissionCode[]): boolean {
    // Owner always has all permissions
    if (cached.role === ROLES.OWNER) {
      return true;
    }

    return permissions.some(permission => cached.permissions.has(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(cached: CachedPermissions, permissions: PermissionCode[]): boolean {
    // Owner always has all permissions
    if (cached.role === ROLES.OWNER) {
      return true;
    }

    return permissions.every(permission => cached.permissions.has(permission));
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();