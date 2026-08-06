/**
 * Permission Cache
 * 
 * Provides efficient caching for user permissions to minimize database queries.
 * Permissions are loaded once after login and cached for the session.
 * 
 * Effective permission calculation:
 *   effective = (role template defaults ∪ granted overrides) − revoked overrides
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { ALL_PERMISSIONS, PermissionCode, ROLES, Role } from "./constants";

export interface CachedPermissions {
  userId: string;
  role: Role;
  /** Effective permissions after applying role template + overrides */
  permissions: Set<PermissionCode>;
  /** Permissions granted by the role template (defaults) */
  templatePermissions: Set<PermissionCode>;
  /** Explicit overrides: permission -> granted (true=added, false=removed) */
  overrides: Map<PermissionCode, boolean>;
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
   * Fetch permissions from database and compute the effective permission set.
   * 
   * Effective calculation:
   *   effective = (role template defaults ∪ explicitly granted) − explicitly revoked
   * 
   * - Owner: all permissions, no overrides needed.
   * - Manager/Staff: role template permissions provide the baseline, then explicit
   *   user_permissions rows (granted=true or granted=false) override the baseline.
   */
  private async _fetchPermissionsFromDb(userId: string, role: Role): Promise<CachedPermissions> {
    // Owner has all permissions
    if (role === ROLES.OWNER) {
      return {
        userId,
        role,
        permissions: new Set(ALL_PERMISSIONS),
        templatePermissions: new Set(ALL_PERMISSIONS),
        overrides: new Map<PermissionCode, boolean>(),
        loadedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
    }

    try {
      // ── 1. Fetch role template defaults for this role ──────────────────────
      let templateCodes = new Set<PermissionCode>();

      const { data: roleTemplate, error: templateError } = await supabaseAdmin
        .from("role_templates")
        .select(`
          id,
          role,
          role_template_permissions(
            permission:permissions(code)
          )
        `)
        .eq("role", role)
        .single();

      if (templateError) {
        console.error("Error fetching role template permissions:", templateError);
      } else if (roleTemplate) {
        const rtp = (roleTemplate as any).role_template_permissions;
        if (Array.isArray(rtp)) {
          for (const entry of rtp) {
            if (entry && entry.permission && typeof entry.permission === "object" && "code" in entry.permission) {
              const code = (entry.permission as any).code as PermissionCode;
              if (code) {
                templateCodes.add(code);
              }
            }
          }
        }
      }

      // ── 2. Fetch ALL explicit user overrides (granted true AND false) ──────
      const { data: userPermissions, error: userPermError } = await supabaseAdmin
        .from("user_permissions")
        .select(`
          granted,
          permission:permissions(code)
        `)
        .eq("user_id", userId);

      if (userPermError) {
        console.error("Error fetching user permissions:", userPermError);
      }

      const overrides = new Map<PermissionCode, boolean>();

      if (userPermissions) {
        for (const up of userPermissions) {
          if (up.permission && typeof up.permission === "object" && "code" in up.permission) {
            const code = (up.permission as any).code as PermissionCode;
            if (code) {
              overrides.set(code, Boolean(up.granted));
            }
          }
        }
      }

      // ── 3. Compute effective permissions ───────────────────────────────────
      // Start with role template defaults, then apply explicit overrides.
      const effective = new Set<PermissionCode>(templateCodes);

      for (const [code, granted] of overrides.entries()) {
        if (granted) {
          effective.add(code);
        } else {
          effective.delete(code);
        }
      }

      return {
        userId,
        role,
        permissions: effective,
        templatePermissions: templateCodes,
        overrides,
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
        templatePermissions: new Set<PermissionCode>(),
        overrides: new Map<PermissionCode, boolean>(),
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