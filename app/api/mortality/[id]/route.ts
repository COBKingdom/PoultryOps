import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { canEdit } from "@/lib/permissions/governance";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const authResult =
      await getAuthenticatedUser(request);

    if (
      !authResult.success ||
      !authResult.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            authResult.error ||
            "Unauthorized",
        },
        {
          status:
            authResult.statusCode || 401,
        }
      );
    }

    const user = authResult.user;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Mortality record ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      farm_id,
      flock_id,
      mortality_date,
      quantity,
      reason,
    } = body;

    if (
      !farm_id ||
      !flock_id ||
      !mortality_date ||
      quantity === undefined ||
      quantity === null ||
      Number(quantity) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid mortality data",
        },
        { status: 400 }
      );
    }

    /*
     * Load the authenticated user's profile.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, role, farm_id"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User profile not found",
        },
        { status: 403 }
      );
    }

    /*
     * Prevent cross-farm modification.
     */
    if (profile.farm_id !== farm_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot modify mortality for this farm",
        },
        { status: 403 }
      );
    }

    /*
     * Load the existing mortality record.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("mortality")
      .select(`
        id,
        farm_id,
        flock_id,
        mortality_date,
        quantity,
        reason,
        created_by,
        created_at,
        updated_by,
        updated_at
      `)
      .eq("id", id)
      .eq("farm_id", farm_id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Mortality record not found",
        },
        { status: 404 }
      );
    }

    /*
     * Preserve the existing governance rules.
     */
    const governanceResult =
      canEdit(
        {
          id: user.id,
          role: profile.role || "",
        },
        existing
      );

    if (!governanceResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            governanceResult.reason ||
            "You cannot edit this mortality record",
        },
        { status: 403 }
      );
    }

    const updatedAt =
      new Date().toISOString();

    /*
     * Update mortality using the server-side
     * service-role client.
     */
    const {
      data: updated,
      error: updateError,
    } = await supabaseAdmin
      .from("mortality")
      .update({
        flock_id,
        mortality_date,
        quantity: Number(quantity),
        reason: reason || null,
        updated_by: user.id,
        updated_at: updatedAt,
      })
      .eq("id", id)
      .eq("farm_id", farm_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    /*
     * Audit logging also happens server-side.
     *
     * This is necessary because audit_logs intentionally
     * does not allow direct browser INSERT operations.
     */
    const {
      error: auditError,
    } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "update",
        resource_type: "mortality",
        resource_id: id,
        old_values: existing,
        new_values: updated,
        metadata: {
          farm_id,
          flock_id,
        },
      });

    if (auditError) {
      /*
       * Do not undo a successful mortality update
       * because audit logging failed.
       */
      console.error(
        "[mortality] audit log failed:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      mortality: updated,
    });
  } catch (error) {
    console.error(
      "[mortality] update failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update mortality record",
      },
      { status: 500 }
    );
  }
}