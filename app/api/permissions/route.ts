import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { permissionCache } from "@/lib/permissions/cache";
import { PERMISSIONS, ROLES } from "@/lib/permissions/constants";

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
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}