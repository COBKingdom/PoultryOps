import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { permissionCache } from "@/lib/permissions/cache";
import { PERMISSIONS, ROLES } from "@/lib/permissions/constants";
import { requirePermission } from "@/lib/permissions/api";

export async function GET(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Check if a target userId query parameter was supplied
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("userId");

    // ── No target userId: return the authenticated user's own permissions ──
    if (!targetUserId) {
      // Get user profile to check role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      const role = profile.role as typeof ROLES[keyof typeof ROLES];

      // Owner has all permissions
      if (role === ROLES.OWNER) {
        return NextResponse.json({
          role,
          permissions: Object.values(PERMISSIONS),
        });
      }

      // Load permissions from cache/database
      const cached = await permissionCache.loadPermissions(userId, role);
      
      return NextResponse.json({
        role,
        permissions: Array.from(cached.permissions),
      });
    }

    // ── Target userId supplied: return the target user's permissions ──
    // Verify the requester has SETTINGS_MANAGE_USERS permission
    const permissionResult = await requirePermission(PERMISSIONS.SETTINGS_MANAGE_USERS, request);
    
    if (!permissionResult.success) {
      return NextResponse.json(
        { error: permissionResult.error },
        { status: permissionResult.statusCode }
      );
    }

    // Get requester's profile and farm_id
    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("farm_id")
      .eq("id", userId)
      .single();

    if (requesterProfileError || !requesterProfile?.farm_id) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    // Get target user's profile
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role, farm_id")
      .eq("id", targetUserId)
      .single();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Verify the target user belongs to the same farm as the requester
    if (targetProfile.farm_id !== requesterProfile.farm_id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const targetRole = targetProfile.role as typeof ROLES[keyof typeof ROLES];

    // Load the target user's actual saved permissions from cache/database
    const cached = await permissionCache.loadPermissions(targetUserId, targetRole);

    return NextResponse.json({
      role: targetRole,
      permissions: Array.from(cached.permissions),
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}