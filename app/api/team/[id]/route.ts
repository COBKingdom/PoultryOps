import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions/api";
import { PERMISSIONS } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_VIEW, request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    const { id } = await params;

    const { data: member, error: memberError } = await supabaseAdmin
      .from("profiles")
.select(`
  id,
  full_name,
  email,
  role,
  created_at
`)
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error in GET /api/team/[id]:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_EDIT, request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    const { id } = await params;

    // Get the target member's profile
    const { data: member, error: memberError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, farm_id")
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Never allow deleting the owner
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "The owner cannot be deleted" },
        { status: 400 }
      );
    }

    // Verify the member belongs to the same farm as the requester
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("farm_id")
      .eq("id", result.userId!)
      .single();

    if (requesterProfile?.farm_id !== member.farm_id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the farm membership record
    const { error: farmUserError } = await supabaseAdmin
      .from("farm_users")
      .delete()
      .eq("user_id", id);

    if (farmUserError) {
      console.error(farmUserError);
      return NextResponse.json(
        { error: farmUserError.message },
        { status: 500 }
      );
    }

    // Remove any pending invitations for this member's email on this farm
    await supabaseAdmin
      .from("user_invitations")
      .delete()
      .eq("email", member.email)
      .eq("farm_id", member.farm_id);

    // Delete the profile (cascades to user_permissions and email_events)
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      console.error(profileDeleteError);
      return NextResponse.json(
        { error: profileDeleteError.message },
        { status: 500 }
      );
    }

    // Remove the Supabase Auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error(authDeleteError);
      return NextResponse.json(
        { error: authDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/team/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_EDIT, request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    const { id } = await params;

const body = await request.json();

const permissionPayload = body.permissions?.[0];

if (!permissionPayload) {
  return NextResponse.json(
    { error: "Permission payload is required" },
    { status: 400 }
  );
}

const permissionCode = permissionPayload.code;
const granted = permissionPayload.granted;

// Find permission id
const { data: permissionRecord } = await supabaseAdmin
  .from("permissions")
  .select("id")
  .eq("code", permissionCode)
  .single();

if (!permissionRecord) {
  return NextResponse.json(
    { error: "Permission not found" },
    { status: 404 }
  );
}

// Save override
const { error } = await supabaseAdmin
  .from("user_permissions")
  .upsert(
    {
      user_id: id,
      permission_id: permissionRecord.id,
      granted,
    },
    {
      onConflict: "user_id,permission_id",
    }
  );

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissionCode,
      granted,
    });
  } catch (error) {
    console.error("Error in PATCH /api/team/[id]:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}