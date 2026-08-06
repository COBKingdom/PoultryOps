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