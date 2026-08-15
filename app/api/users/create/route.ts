import { NextResponse } from "next/server";
import { createUser } from "@/lib/users/create-user";
import { requirePermission } from "@/lib/permissions/api";
import { PERMISSIONS } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    // Authenticate and authorize the requester using the existing helper.
    // Only an authorized farm owner/team manager can create users.
    const authResult = await requirePermission(PERMISSIONS.TEAM_INVITE, req);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const body = await req.json();

    const {
      email,
      password,
      fullName,
      farmId,
      role = "staff",
      permissions = [],
      sendInvitation = false,
      invitedBy,
    } = body;

    if (!email || !password || !farmId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName, farmId" },
        { status: 400 }
      );
    }

    // Verify the farmId belongs to the authenticated requester's farm
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("farm_id")
      .eq("id", authResult.userId!)
      .single();

    if (requesterProfile?.farm_id !== farmId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const result = await createUser({
      email,
      password,
      fullName,
      farmId,
      role,
      permissions,
      sendInvitation,
      invitedBy,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      invitationId: result.invitationId,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}