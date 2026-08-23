import { getAuthenticatedUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface PlatformAdmin {
  userId: string;
  email: string;
  adminRole: string;
  active: boolean;
}

export interface PlatformAdminAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  admin?: PlatformAdmin;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticates the request and verifies that the authenticated
 * user is an active PoultryOps platform administrator.
 *
 * This is separate from farm-level roles such as:
 * owner / manager / staff.
 *
 * Authentication:
 *   lib/auth/server.ts
 *
 * Platform authorization:
 *   public.platform_admins
 *
 * Privileged database access:
 *   lib/supabase-admin.ts
 */
export async function requirePlatformAdmin(
  request: Request
): Promise<PlatformAdminAuthResult> {
  // ----------------------------------------------------------
  // 1. Authenticate the request using the existing
  //    PoultryOps server-side authentication mechanism.
  // ----------------------------------------------------------

  const authResult = await getAuthenticatedUser(request);

  if (!authResult.success || !authResult.user) {
    return {
      success: false,
      error: authResult.error || "Unauthorized",
      statusCode: authResult.statusCode || 401,
    };
  }

  const user = authResult.user;

  // ----------------------------------------------------------
  // 2. Check the separate platform administrator registry.
  //
  //    IMPORTANT:
  //    This does NOT check profiles.role.
  //    Farm roles remain completely separate.
  // ----------------------------------------------------------

  const { data: adminRecord, error: adminError } =
    await supabaseAdmin
      .from("platform_admins")
      .select("user_id, admin_role, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

  if (adminError) {
    console.error(
      "Platform admin authorization lookup failed:",
      adminError
    );

    return {
      success: false,
      error: "Unable to verify platform authorization",
      statusCode: 500,
    };
  }

  // ----------------------------------------------------------
  // 3. Authenticated user, but not a platform administrator.
  // ----------------------------------------------------------

  if (!adminRecord) {
    return {
      success: false,
      error: "Platform administrator access required",
      statusCode: 403,
    };
  }

  // ----------------------------------------------------------
  // 4. Authorization successful.
  // ----------------------------------------------------------

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
    admin: {
      userId: adminRecord.user_id,
      email: user.email,
      adminRole: adminRecord.admin_role,
      active: adminRecord.active,
    },
  };
}
