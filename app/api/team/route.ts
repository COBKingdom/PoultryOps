import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions/api";
import { PERMISSIONS } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const result = await requirePermission(PERMISSIONS.TEAM_VIEW, request);
    
    if (!result.success) {
      console.log("Permission check failed:", result);
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    console.log("Authenticated user:", result.userId, "role:", result.role);

    // Get farm ID from user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("farm_id")
      .eq("id", result.userId)
      .single();

    console.log("Profile query result:", { profile, profileError });

    if (profileError || !profile?.farm_id) {
      console.log("Farm not found for user:", result.userId);
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    console.log("Fetching members for farm:", profile.farm_id);

    // Get all team members for this farm
    const { data: members, error: membersError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        created_at
      `)
      .eq("farm_id", profile.farm_id)
      .order("created_at", { ascending: true });

    console.log("Members query result:", { 
      membersCount: members?.length, 
      membersError,
      members: members?.slice(0, 2) // Log first 2 members for debugging
    });

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    console.log("Returning members:", members?.length || 0);
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
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Call the centralized user creation service
    const createUserResponse = await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
        fullName: full_name.trim(),
        farmId: profile.farm_id,
        role: role,
        permissions: permissions || [],
        sendInvitation: true,
        invitedBy: result.userId,
      }),
    });

    const createUserData = await createUserResponse.json();

    if (!createUserResponse.ok) {
      return NextResponse.json(
        { error: createUserData.error || "Failed to create user" },
        { status: createUserResponse.status }
      );
    }

    // Return success with temporary password so it can be displayed to the user
    return NextResponse.json(
      {
        success: true,
        userId: createUserData.userId,
        invitationId: createUserData.invitationId,
        temporaryPassword,
        message: createUserData.message || "Invitation sent successfully",
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

// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%";
  
  // Ensure at least one character from each category
  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  
  // Add 4 more random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 4; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the password
  return password.sort(() => Math.random() - 0.5).join('');
}
