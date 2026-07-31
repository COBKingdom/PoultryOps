import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions/api";
import { PERMISSIONS } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_VIEW, request);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    // Get farm ID from user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("farm_id")
      .eq("id", result.userId)
      .single();

    if (profileError || !profile?.farm_id) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    // Get all team members for this farm
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        created_at,
        last_sign_in_at
      `)
      .eq("farm_id", profile.farm_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Error in GET /api/team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_INVITE, request);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    const body = await request.json();
    const { full_name, email, role, permissions } = body;

    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, role" },
        { status: 400 }
      );
    }

    // Get farm ID from user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("farm_id")
      .eq("id", result.userId)
      .single();

    if (profileError || !profile?.farm_id) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    // Create invitation (TODO: Implement actual invitation logic)
    // For now, create a pending profile
    const { data: newMember, error: createError } = await supabase
      .from("profiles")
      .insert({
        full_name,
        email,
        role,
        farm_id: profile.farm_id,
        status: "pending",
        invited_by: result.userId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating team member:", createError);
      return NextResponse.json(
        { error: "Failed to create team member" },
        { status: 500 }
      );
    }

    // TODO: Assign permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Insert permissions into user_permissions table
      const permissionInserts = permissions.map((permissionCode: string) => ({
        user_id: newMember.id,
        permission_code: permissionCode,
        granted: true,
      }));

      const { error: permError } = await supabase
        .from("user_permissions")
        .insert(permissionInserts);

      if (permError) {
        console.error("Error assigning permissions:", permError);
        // Don't fail the request, just log the error
      }
    }

    // TODO: Send invitation email
    console.log(`Invitation sent to ${email} for farm ${profile.farm_id}`);

    return NextResponse.json(
      { 
        success: true, 
        member: newMember,
        message: "Invitation sent successfully"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}