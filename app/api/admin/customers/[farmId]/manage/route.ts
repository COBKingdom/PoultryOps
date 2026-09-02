import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ManageAction =
  | "suspend"
  | "reactivate"
  | "extend_trial"
  | "delete";

type RequestBody = {
  action?: ManageAction;
  trialDays?: number;
  confirmationName?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ farmId: string }>;
  }
) {
  const authResult = await requirePlatformAdmin(request);

  if (!authResult.success || !authResult.user) {
    return jsonError(
      authResult.error || "Platform administrator access required",
      authResult.statusCode || 403
    );
  }

  const { farmId } = await context.params;

  if (!farmId) {
    return jsonError("Farm ID is required", 400);
  }

  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const action = body.action;

  if (
    action !== "suspend" &&
    action !== "reactivate" &&
    action !== "extend_trial" &&
    action !== "delete"
  ) {
    return jsonError("Invalid management action", 400);
  }

  /*
   * Load the farm first.
   */
  const { data: farm, error: farmError } = await supabaseAdmin
    .from("farms")
    .select("id, name, farm_code, active, owner_id")
    .eq("id", farmId)
    .maybeSingle();

  if (farmError) {
    console.error("Admin farm lookup failed:", farmError);
    return jsonError("Unable to load customer farm", 500);
  }

  if (!farm) {
    return jsonError("Customer farm not found", 404);
  }

  /*
   * Never allow a Platform Admin to delete their own farm/account.
   *
   * We check both the owner and every farm member so the protection
   * remains safe even if the admin account is not the owner.
   */
  const { data: farmProfiles, error: farmProfilesError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, email, role, is_platform_admin")
      .eq("farm_id", farmId);

  if (farmProfilesError) {
    console.error(
      "Admin farm profile lookup failed:",
      farmProfilesError
    );
    return jsonError("Unable to verify customer users", 500);
  }

  const protectedAdmin = (farmProfiles || []).find(
    (profile) =>
      profile.id === authResult.user?.id ||
      profile.is_platform_admin === true
  );

  if (protectedAdmin && action === "delete") {
    return jsonError(
      "This customer farm contains a Platform Administrator account and cannot be deleted from here.",
      403
    );
  }

  /*
   * SUSPEND
   *
   * This is a platform-level account control.
   * It deliberately does NOT modify subscriptions.status.
   */
  if (action === "suspend") {
    if (!farm.active) {
      return NextResponse.json({
        success: true,
        action,
        message: "Customer account is already suspended.",
        farm: {
          id: farm.id,
          active: false,
        },
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("farms")
      .update({
        active: false,
      })
      .eq("id", farmId);

    if (updateError) {
      console.error(
        "Admin farm suspension failed:",
        updateError
      );
      return jsonError("Unable to suspend customer account", 500);
    }

    await writeAdminAuditLog({
      adminUserId: authResult.user.id,
      farmId,
      action: "admin_suspend_customer",
      oldValues: {
        active: farm.active,
      },
      newValues: {
        active: false,
      },
      metadata: {
        farm_name: farm.name,
        farm_code: farm.farm_code,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      action,
      message: "Customer account suspended successfully.",
      farm: {
        id: farm.id,
        active: false,
      },
    });
  }

  /*
   * REACTIVATE
   *
   * This only restores the platform account.
   * It deliberately does NOT modify subscription.status.
   */
  if (action === "reactivate") {
    if (farm.active) {
      return NextResponse.json({
        success: true,
        action,
        message: "Customer account is already active.",
        farm: {
          id: farm.id,
          active: true,
        },
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("farms")
      .update({
        active: true,
      })
      .eq("id", farmId);

    if (updateError) {
      console.error(
        "Admin farm reactivation failed:",
        updateError
      );
      return jsonError(
        "Unable to reactivate customer account",
        500
      );
    }

    await writeAdminAuditLog({
      adminUserId: authResult.user.id,
      farmId,
      action: "admin_reactivate_customer",
      oldValues: {
        active: farm.active,
      },
      newValues: {
        active: true,
      },
      metadata: {
        farm_name: farm.name,
        farm_code: farm.farm_code,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      action,
      message: "Customer account reactivated successfully.",
      farm: {
        id: farm.id,
        active: true,
      },
    });
  }

  /*
   * EXTEND TRIAL
   *
   * We only modify trial_end.
   * We do not manufacture a payment, change plan,
   * or change subscription.status.
   */
  if (action === "extend_trial") {
    const requestedDays = Number(body.trialDays);

    if (
      !Number.isFinite(requestedDays) ||
      !Number.isInteger(requestedDays) ||
      requestedDays < 1 ||
      requestedDays > 365
    ) {
      return jsonError(
        "Trial extension must be a whole number of days between 1 and 365.",
        400
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, farm_id, status, trial_start, trial_end, selected_plan, plan"
        )
        .eq("farm_id", farmId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Admin subscription lookup failed:",
        subscriptionError
      );
      return jsonError(
        "Unable to load customer subscription",
        500
      );
    }

    if (!subscription) {
      return jsonError(
        "This customer does not have a subscription record.",
        404
      );
    }

    const now = new Date();

    const existingTrialEnd = subscription.trial_end
      ? new Date(subscription.trial_end)
      : null;

    /*
     * Extend from the later of:
     * - existing trial end
     * - now
     *
     * This means an already-expired trial can also be extended
     * without creating a date in the past.
     */
    const baseDate =
      existingTrialEnd && existingTrialEnd.getTime() > now.getTime()
        ? existingTrialEnd
        : now;

    const newTrialEnd = new Date(baseDate.getTime());

    newTrialEnd.setUTCDate(
      newTrialEnd.getUTCDate() + requestedDays
    );

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        trial_end: newTrialEnd.toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error(
        "Admin trial extension failed:",
        updateError
      );
      return jsonError(
        "Unable to extend customer trial",
        500
      );
    }

    await writeAdminAuditLog({
      adminUserId: authResult.user.id,
      farmId,
      action: "admin_extend_trial",
      oldValues: {
        trial_end: subscription.trial_end,
      },
      newValues: {
        trial_end: newTrialEnd.toISOString(),
      },
      metadata: {
        farm_name: farm.name,
        farm_code: farm.farm_code,
        extension_days: requestedDays,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      action,
      message: `Trial extended by ${requestedDays} day${requestedDays === 1 ? "" : "s"}.`,
      subscription: {
        id: subscription.id,
        trial_end: newTrialEnd.toISOString(),
      },
    });
  }

  /*
   * DELETE
   *
   * Exact farm-name confirmation is mandatory.
   */
  if (action === "delete") {
    const confirmationName = String(
      body.confirmationName || ""
    ).trim();

    if (!confirmationName) {
      return jsonError(
        "Exact farm-name confirmation is required.",
        400
      );
    }

    if (confirmationName !== farm.name) {
      return jsonError(
        "The confirmation name does not exactly match the farm name.",
        400
      );
    }

    /*
     * Capture all Auth users before deleting application data.
     */
    const userIds = new Set<string>();

    if (farm.owner_id) {
      userIds.add(farm.owner_id);
    }

    for (const profile of farmProfiles || []) {
      if (profile.id) {
        userIds.add(profile.id);
      }
    }

    const { data: farmUsers, error: farmUsersError } =
      await supabaseAdmin
        .from("farm_users")
        .select("user_id")
        .eq("farm_id", farmId);

    if (farmUsersError) {
      console.error(
        "Admin farm users lookup failed:",
        farmUsersError
      );
      return jsonError(
        "Unable to determine all customer users",
        500
      );
    }

    for (const member of farmUsers || []) {
      if (member.user_id) {
        userIds.add(member.user_id);
      }
    }

    /*
     * Write the deletion audit record BEFORE deleting the
     * customer's application data.
     *
     * The audit record belongs to the Platform Admin, not the
     * customer, so it survives customer deletion.
     */
    const auditResult = await writeAdminAuditLog({
      adminUserId: authResult.user.id,
      farmId,
      action: "admin_delete_customer",
      oldValues: {
        farm_id: farm.id,
        farm_name: farm.name,
        farm_code: farm.farm_code,
        owner_id: farm.owner_id,
        active: farm.active,
      },
      newValues: {
        deleted: true,
      },
      metadata: {
        customer_user_ids: Array.from(userIds),
        customer_user_count: userIds.size,
      },
      request,
    });

    if (!auditResult.success) {
      return jsonError(
        "Customer deletion was stopped because the administrative audit record could not be created.",
        500
      );
    }

    /*
     * Delete farm-owned application data.
     *
     * We deliberately delete child records explicitly instead of
     * relying on assumed ON DELETE CASCADE behaviour.
     */
    const deletionSteps: Array<{
      table: string;
      column: string;
    }> = [
      { table: "pogp_attributions", column: "farm_id" },
      { table: "pogp_commissions", column: "farm_id" },
      { table: "referral_attributions", column: "farm_id" },
      { table: "referral_commissions", column: "farm_id" },
      { table: "isolation_records", column: "farm_id" },
      { table: "mortality", column: "farm_id" },
      { table: "health", column: "farm_id" },
      { table: "egg_production", column: "farm_id" },
      { table: "feed_records", column: "farm_id" },
      { table: "feed_inventory", column: "farm_id" },
      { table: "expenses", column: "farm_id" },
      { table: "sales", column: "farm_id" },
      { table: "payments", column: "farm_id" },
      { table: "email_events", column: "user_id" },
      { table: "audit_logs", column: "user_id" },
      { table: "user_permissions", column: "user_id" },
      { table: "user_invitations", column: "farm_id" },
      { table: "farm_users", column: "farm_id" },
      { table: "subscriptions", column: "farm_id" },
      { table: "pogp_partners", column: "profile_id" },
      { table: "profiles", column: "id" },
    ];

    /*
     * Farm-specific rows.
     */
    const farmRows = deletionSteps.filter(
      (step) =>
        step.column === "farm_id" &&
        step.table !== "profiles" &&
        step.table !== "farm_users" &&
        step.table !== "subscriptions" &&
        step.table !== "payments"
    );

    /*
     * Delete normal farm-owned tables.
     *
     * We use individual operations so one problematic optional
     * table can be identified precisely.
     */
    for (const step of farmRows) {
      const { error } = await supabaseAdmin
        .from(step.table)
        .delete()
        .eq(step.column, farmId);

      if (error) {
        console.error(
          `Admin customer deletion failed on ${step.table}:`,
          error
        );

        return jsonError(
          `Customer deletion stopped while removing ${step.table}. No further customer data was deleted.`,
          500
        );
      }
    }

    /*
     * Payments.
     */
    {
      const { error } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("farm_id", farmId);

      if (error) {
        console.error(
          "Admin customer payment deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing payment records.",
          500
        );
      }
    }

    /*
     * Subscription.
     */
    {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .delete()
        .eq("farm_id", farmId);

      if (error) {
        console.error(
          "Admin customer subscription deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing subscription records.",
          500
        );
      }
    }

    /*
     * Delete POGP partner records belonging to customer profiles.
     */
    for (const userId of userIds) {
      const { error } = await supabaseAdmin
        .from("pogp_partners")
        .delete()
        .eq("profile_id", userId);

      if (error) {
        console.error(
          "Admin POGP partner deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing POGP records.",
          500
        );
      }
    }

    /*
     * Delete user-specific rows.
     */
    for (const userId of userIds) {
      const { error: emailError } = await supabaseAdmin
        .from("email_events")
        .delete()
        .eq("user_id", userId);

      if (emailError) {
        console.error(
          "Admin email event deletion failed:",
          emailError
        );

        return jsonError(
          "Customer deletion stopped while removing email history.",
          500
        );
      }

      const { error: permissionError } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", userId);

      if (permissionError) {
        console.error(
          "Admin permission deletion failed:",
          permissionError
        );

        return jsonError(
          "Customer deletion stopped while removing user permissions.",
          500
        );
      }

      const { error: auditError } = await supabaseAdmin
        .from("audit_logs")
        .delete()
        .eq("user_id", userId);

      if (auditError) {
        console.error(
          "Admin customer audit-history deletion failed:",
          auditError
        );

        return jsonError(
          "Customer deletion stopped while removing customer audit history.",
          500
        );
      }
    }

    /*
     * Invitations and farm memberships.
     */
    {
      const { error } = await supabaseAdmin
        .from("user_invitations")
        .delete()
        .eq("farm_id", farmId);

      if (error) {
        console.error(
          "Admin invitation deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing invitations.",
          500
        );
      }
    }

    {
      const { error } = await supabaseAdmin
        .from("farm_users")
        .delete()
        .eq("farm_id", farmId);

      if (error) {
        console.error(
          "Admin farm membership deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing farm memberships.",
          500
        );
      }
    }

    /*
     * Delete customer profiles.
     */
    for (const userId of userIds) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error(
          "Admin customer profile deletion failed:",
          error
        );

        return jsonError(
          "Customer deletion stopped while removing customer profiles.",
          500
        );
      }
    }

    /*
     * Finally delete the farm.
     */
    {
      const { error } = await supabaseAdmin
        .from("farms")
        .delete()
        .eq("id", farmId);

      if (error) {
        console.error(
          "Admin farm deletion failed:",
          error
        );

        return jsonError(
          "Customer application data was removed, but the farm record could not be deleted. Manual cleanup is required.",
          500
        );
      }
    }

    /*
     * Finally remove the Auth users.
     *
     * This must happen after application records because profiles
     * and other application tables depend on the Auth identities.
     */
    const authDeletionFailures: string[] = [];

    for (const userId of userIds) {
      const { error } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error(
          `Admin Auth deletion failed for ${userId}:`,
          error
        );

        authDeletionFailures.push(userId);
      }
    }

    if (authDeletionFailures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          partial: true,
          error:
            "Customer farm data was deleted, but one or more Supabase Auth users could not be removed.",
          deletedFarmId: farmId,
          failedAuthUserIds: authDeletionFailures,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      message: "Customer and farm deleted successfully.",
      deletedFarmId: farmId,
      deletedUserCount: userIds.size,
    });
  }

  return jsonError("Unsupported management action", 400);
}

async function writeAdminAuditLog({
  adminUserId,
  farmId,
  action,
  oldValues,
  newValues,
  metadata,
  request,
}: {
  adminUserId: string;
  farmId: string;
  action: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  metadata: Record<string, unknown>;
  request: Request;
}) {
  const { error } = await supabaseAdmin
    .from("audit_logs")
    .insert({
      user_id: adminUserId,
      action,
      resource_type: "farm",
      resource_id: farmId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
      ip_address:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        null,
      user_agent: request.headers.get("user-agent") || null,
    });

  if (error) {
    console.error("Admin audit log insert failed:", error);
    return { success: false };
  }

  return { success: true };
}