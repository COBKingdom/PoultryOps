/**
 * API Authorization Helpers
 * 
 * Reusable helpers for API route authorization.
 * Provides consistent permission checking for server-side code.
 * 
 * Usage:
 * ```typescript
 * import { requirePermission } from '@/lib/permissions/api';
 * 
 * export async function POST(request: Request) {
 *   const result = await requirePermission(PERMISSIONS.SALES_CREATE, request);
 *   if (!result.success) {
 *     return NextResponse.json({ error: result.error }, { status: result.statusCode });
 *   }
 *   // ... handle request
 * }
 * ```
 */

import { supabase } from "@/lib/supabase";
import { permissionCache } from "./cache";
import { PermissionCode, ROLES, Role } from "./constants";

export interface ApiPermissionResult {
  success: boolean;
  userId?: string;
  role?: Role;
  error?: string;
  statusCode?: number;
}

/**
 * Get session from request
 */
async function getSessionFromRequest(request?: Request) {
  try {
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return null;
        }
        return { user };
      }
    }
    
    // Try to get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return { user: session.user };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Require a specific permission
 * Returns error response if user doesn't have permission
 */
export async function requirePermission(
  permission: PermissionCode,
  request?: Request
): Promise<ApiPermissionResult> {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const userId = session.user.id;
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found",
        statusCode: 404,
      };
    }

    const role = profile.role as Role;

    // Owner has all permissions
    if (role === ROLES.OWNER) {
      return {
        success: true,
        userId,
        role,
      };
    }

    // Check cached permissions
    const cached = permissionCache.get(userId);
    if (cached) {
      const hasPermission = permissionCache.hasPermission(cached, permission);
      if (hasPermission) {
        return {
          success: true,
          userId,
          role,
        };
      }
    } else {
      // Load permissions from database
      await permissionCache.loadPermissions(userId, role);
      const freshCached = permissionCache.get(userId);
      if (freshCached) {
        const hasPermission = permissionCache.hasPermission(freshCached, permission);
        if (hasPermission) {
          return {
            success: true,
            userId,
            role,
          };
        }
      }
    }

    // Permission denied
    return {
      success: false,
      userId,
      role,
      error: "Forbidden",
      statusCode: 403,
    };
  } catch (error) {
    console.error("Error checking permission:", error);
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  permissions: PermissionCode[],
  request?: Request
): Promise<ApiPermissionResult> {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const userId = session.user.id;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found",
        statusCode: 404,
      };
    }

    const role = profile.role as Role;

    // Owner has all permissions
    if (role === ROLES.OWNER) {
      return {
        success: true,
        userId,
        role,
      };
    }

    // Check cached permissions
    const cached = permissionCache.get(userId);
    if (cached) {
      const hasPermission = permissionCache.hasAnyPermission(cached, permissions);
      if (hasPermission) {
        return {
          success: true,
          userId,
          role,
        };
      }
    } else {
      // Load permissions from database
      await permissionCache.loadPermissions(userId, role);
      const freshCached = permissionCache.get(userId);
      if (freshCached) {
        const hasPermission = permissionCache.hasAnyPermission(freshCached, permissions);
        if (hasPermission) {
          return {
            success: true,
            userId,
            role,
          };
        }
      }
    }

    // Permission denied
    return {
      success: false,
      userId,
      role,
      error: "Forbidden",
      statusCode: 403,
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(
  permissions: PermissionCode[],
  request?: Request
): Promise<ApiPermissionResult> {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const userId = session.user.id;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found",
        statusCode: 404,
      };
    }

    const role = profile.role as Role;

    // Owner has all permissions
    if (role === ROLES.OWNER) {
      return {
        success: true,
        userId,
        role,
      };
    }

    // Check cached permissions
    const cached = permissionCache.get(userId);
    if (cached) {
      const hasPermission = permissionCache.hasAllPermissions(cached, permissions);
      if (hasPermission) {
        return {
          success: true,
          userId,
          role,
        };
      }
    } else {
      // Load permissions from database
      await permissionCache.loadPermissions(userId, role);
      const freshCached = permissionCache.get(userId);
      if (freshCached) {
        const hasPermission = permissionCache.hasAllPermissions(freshCached, permissions);
        if (hasPermission) {
          return {
            success: true,
            userId,
            role,
          };
        }
      }
    }

    // Permission denied
    return {
      success: false,
      userId,
      role,
      error: "Forbidden",
      statusCode: 403,
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}

/**
 * Require owner role
 */
export async function requireOwner(request?: Request): Promise<ApiPermissionResult> {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
        statusCode: 401,
      };
    }

    const userId = session.user.id;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found",
        statusCode: 404,
      };
    }

    const role = profile.role as Role;

    // Check if owner
    if (role !== ROLES.OWNER) {
      return {
        success: false,
        userId,
        role,
        error: "Forbidden - Owner access required",
        statusCode: 403,
      };
    }

    return {
      success: true,
      userId,
      role,
    };
  } catch (error) {
    console.error("Error checking owner status:", error);
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}