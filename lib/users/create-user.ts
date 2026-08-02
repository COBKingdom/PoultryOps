import { createClient } from "@supabase/supabase-js";

export interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  farmId: string;
  role: string;
  permissions?: string[];
  sendInvitation?: boolean;
  invitedBy?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  invitationId?: string | null;
  message?: string;
  error?: string;
}

export async function createUser(params: CreateUserParams): Promise<CreateUserResult> {
  try {
    const {
      email,
      password,
      fullName,
      farmId,
      role,
      permissions = [],
      sendInvitation = false,
      invitedBy,
    } = params;

    if (!email || !password || !farmId || !fullName) {
      return {
        success: false,
        error: "Missing required fields: email, password, fullName, farmId",
      };
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get subscription and check limits
const { data: subscription, error: subscriptionError } = await admin
  .from("subscriptions")
  .select("plan, selected_plan, status")
  .eq("farm_id", farmId)
  .single();
    if (subscriptionError || !subscription) {
      return {
        success: false,
        error: "Unable to verify subscription",
      };
    }

    const { count, error: countError } = await admin
      .from("farm_users")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .neq("role", "owner");

    if (countError) {
      return {
        success: false,
        error: "Unable to verify user limits",
      };
    }

    const currentUsers = count || 0;
    let maxUsers = 1;
    const effectivePlan =
  subscription.status === "trial"
    ? subscription.selected_plan
    : subscription.plan;

switch (effectivePlan) {
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
  if (subscription.status === "trial") {
    return {
      success: false,
      error: `Your ${effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)} Trial has reached its user limit.`,
    };
  }

  if (effectivePlan === "solo") {
    return {
      success: false,
      error:
        "Solo plan supports one user only. Upgrade to Team or Business to add users.",
    };
  }

  return {
    success: false,
    error: "User limit reached for your subscription plan.",
  };
}

    // Create Auth user
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    const userId = authUser.user?.id;

    if (!userId) {
      return {
        success: false,
        error: "Failed to create user",
      };
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
      return {
        success: false,
        error: profileError.message,
      };
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
      return {
        success: false,
        error: farmUserError.message,
      };
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

    return {
      success: true,
      userId,
      invitationId,
      message: sendInvitation 
        ? "Invitation sent successfully. Temporary password has been assigned. The new member can log in immediately using the credentials provided in the email."
        : "User created successfully",
    };
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
}
