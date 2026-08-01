import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      fullName,
      farmId,
      role = "data_entry",
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get subscription and check limits
    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("farm_id", farmId)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: "Unable to verify subscription" },
        { status: 400 }
      );
    }

    const { count, error: countError } = await admin
      .from("farm_users")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", farmId);

    if (countError) {
      return NextResponse.json(
        { error: "Unable to verify user limits" },
        { status: 400 }
      );
    }

    const currentUsers = count || 0;
    let maxUsers = 1;

    switch (subscription.plan) {
      case "trial":
        maxUsers = 1;
        break;
      case "solo":
        maxUsers = 1;
        break;
      case "team":
        maxUsers = 3;
        break;
      case "business":
        maxUsers = 6;
        break;
      default:
        maxUsers = 1;
    }

    if (currentUsers >= maxUsers) {
      if (subscription.plan === "trial") {
        return NextResponse.json(
          { error: "Your trial supports owner access only. Upgrade to Team or Business to add users." },
          { status: 400 }
        );
      }
      if (subscription.plan === "solo") {
        return NextResponse.json(
          { error: "Solo plan supports one user only. Upgrade to Team or Business to add users." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "User limit reached for your subscription plan." },
        { status: 400 }
      );
    }

    // Create Auth user
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authUser.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    // Update profile with must_change_password flag
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        farm_id: farmId,
        role: role,
        must_change_password: true,
      })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // Create farm membership
    const { error: farmUserError } = await admin
      .from("farm_users")
      .insert({
        farm_id: farmId,
        user_id: userId,
        role: role,
        status: "active",
      });

    if (farmUserError) {
      return NextResponse.json(
        { error: farmUserError.message },
        { status: 400 }
      );
    }

    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permissionInserts = permissions.map((permissionCode: string) => ({
        user_id: userId,
        permission_code: permissionCode,
        granted: true,
      }));

      const { error: permError } = await admin
        .from("user_permissions")
        .insert(permissionInserts);

      if (permError) {
        console.error("Error assigning permissions:", permError);
      }
    }

    // Create invitation record if this is an invitation
    let invitationId = null;
    if (sendInvitation && invitedBy) {
      const { data: invitation, error: invitationError } = await admin
        .from("user_invitations")
        .insert({
          farm_id: farmId,
          email: email.trim().toLowerCase(),
          role: role,
          invited_by: invitedBy,
          status: "pending",
        })
        .select()
        .single();

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
      } else {
        invitationId = invitation.id;
      }
    }

    // Send invitation email if requested
    if (sendInvitation) {
      try {
        const { sendInvitationEmail } = await import("@/lib/email-service");
        
        // Get farm name
        const { data: farm } = await admin
          .from("farms")
          .select("name")
          .eq("id", farmId)
          .single();

        const farmName = farm?.name || "Your Farm";

        // Send email with credentials
        await sendInvitationEmail(
          email.trim().toLowerCase(),
          farmName,
          password,
          role
        );
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      invitationId,
      message: sendInvitation 
        ? "Invitation sent successfully. Temporary password has been assigned. The new member can log in immediately using the credentials provided in the email."
        : "User created successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
