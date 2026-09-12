import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Action = "deactivate" | "reactivate" | "delete";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Platform admin access required.",
        },
        { status: auth.statusCode || 403 }
      );
    }

    const body = await request.json();

    const vendId = String(body.vendId || "").trim();
    const action = String(body.action || "")
      .trim()
      .toLowerCase() as Action;

    if (!vendId) {
      return NextResponse.json(
        {
          success: false,
          error: "VEND partner ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "deactivate" &&
      action !== "reactivate" &&
      action !== "delete"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid VEND management action.",
        },
        { status: 400 }
      );
    }

    const { data: partner, error: partnerError } =
      await supabaseAdmin
        .from("vend_partners")
        .select(
          "id, profile_id, full_name, email, vend_code, status"
        )
        .eq("id", vendId)
        .maybeSingle();

    if (partnerError) {
      console.error(
        "VEND management partner lookup failed:",
        partnerError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load the VEND partner.",
        },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: "VEND partner not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ------------------------------------------------------------
     * DEACTIVATE / REACTIVATE
     * ------------------------------------------------------------
     *
     * The VEND partner status and profile status are kept aligned.
     * The Supabase Auth account is also banned/unbanned so the
     * partner cannot simply continue signing in after deactivation.
     */
    if (action === "deactivate" || action === "reactivate") {
      const nextStatus =
        action === "deactivate" ? "inactive" : "active";

      if (
        action === "deactivate" &&
        partner.status?.toLowerCase() === "inactive"
      ) {
        return NextResponse.json({
          success: true,
          message: "VEND partner is already inactive.",
          status: "inactive",
        });
      }

      if (
        action === "reactivate" &&
        partner.status?.toLowerCase() === "active"
      ) {
        return NextResponse.json({
          success: true,
          message: "VEND partner is already active.",
          status: "active",
        });
      }

      /*
       * Update Auth first when a real profile exists.
       * If the database update subsequently fails, attempt to
       * restore the previous Auth state.
       */
      if (partner.profile_id) {
        const { error: authError } =
          await supabaseAdmin.auth.admin.updateUserById(
            partner.profile_id,
            {
              ban_duration:
                action === "deactivate"
                  ? "876000h"
                  : "none",
            }
          );

        if (authError) {
          console.error(
            "VEND Auth status update failed:",
            authError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                action === "deactivate"
                  ? "Unable to deactivate the VEND login account."
                  : "Unable to reactivate the VEND login account.",
            },
            { status: 500 }
          );
        }
      }

      const { error: partnerUpdateError } =
        await supabaseAdmin
          .from("vend_partners")
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", partner.id);

      if (partnerUpdateError) {
        console.error(
          "VEND partner status update failed:",
          partnerUpdateError
        );

        /*
         * Roll Auth back if the partner record could not be
         * updated.
         */
        if (partner.profile_id) {
          await supabaseAdmin.auth.admin.updateUserById(
            partner.profile_id,
            {
              ban_duration:
                action === "deactivate"
                  ? "none"
                  : "876000h",
            }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to update the VEND partner status.",
          },
          { status: 500 }
        );
      }

      if (partner.profile_id) {
        const { error: profileError } =
          await supabaseAdmin
            .from("profiles")
            .update({
              status: nextStatus,
            })
            .eq("id", partner.profile_id);

        if (profileError) {
          console.error(
            "VEND profile status update failed:",
            profileError
          );

          /*
           * Restore both the partner and Auth status if the
           * profile update fails.
           */
          await supabaseAdmin
            .from("vend_partners")
            .update({
              status: partner.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", partner.id);

          await supabaseAdmin.auth.admin.updateUserById(
            partner.profile_id,
            {
              ban_duration:
                action === "deactivate"
                  ? "none"
                  : "876000h",
            }
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "Unable to synchronize the VEND profile status.",
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message:
          action === "deactivate"
            ? `${partner.full_name} has been deactivated.`
            : `${partner.full_name} has been reactivated.`,
        status: nextStatus,
      });
    }

    /*
     * ------------------------------------------------------------
     * DELETE
     * ------------------------------------------------------------
     *
     * Permanent deletion is allowed only when the VEND has no
     * referral attribution and no commission history.
     *
     * This prevents accidental destruction of referral/earnings
     * history.
     */
    const [
      { count: attributionCount, error: attributionError },
      { count: commissionCount, error: commissionError },
    ] = await Promise.all([
      supabaseAdmin
        .from("vend_attributions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("vend_id", partner.id),

      supabaseAdmin
        .from("vend_commissions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("vend_id", partner.id),
    ]);

    if (attributionError) {
      console.error(
        "VEND attribution count failed:",
        attributionError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify whether this VEND has referral history.",
        },
        { status: 500 }
      );
    }

    if (commissionError) {
      console.error(
        "VEND commission count failed:",
        commissionError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify whether this VEND has commission history.",
        },
        { status: 500 }
      );
    }

    const referrals = attributionCount || 0;
    const commissions = commissionCount || 0;

    if (referrals > 0 || commissions > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This VEND has referral or commission history and cannot be permanently deleted. Deactivate the VEND instead.",
          protectedByHistory: true,
          referralCount: referrals,
          commissionCount: commissions,
        },
        { status: 409 }
      );
    }

    /*
     * Remove user-specific supporting records first.
     * These are safe to remove because the VEND has no referral
     * or commission history.
     */
    if (partner.profile_id) {
      const { error: emailError } =
        await supabaseAdmin
          .from("email_events")
          .delete()
          .eq("user_id", partner.profile_id);

      if (emailError) {
        console.error(
          "VEND email event deletion failed:",
          emailError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to remove VEND email history.",
          },
          { status: 500 }
        );
      }

      const { error: permissionError } =
        await supabaseAdmin
          .from("user_permissions")
          .delete()
          .eq("user_id", partner.profile_id);

      if (permissionError) {
        console.error(
          "VEND permission deletion failed:",
          permissionError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to remove VEND permission records.",
          },
          { status: 500 }
        );
      }

      const { error: auditError } =
        await supabaseAdmin
          .from("audit_logs")
          .delete()
          .eq("user_id", partner.profile_id);

      if (auditError) {
        console.error(
          "VEND audit deletion failed:",
          auditError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to remove VEND audit history.",
          },
          { status: 500 }
        );
      }
    }

    /*
     * Remove the VEND partner record.
     */
    const { error: deletePartnerError } =
      await supabaseAdmin
        .from("vend_partners")
        .delete()
        .eq("id", partner.id);

    if (deletePartnerError) {
      console.error(
        "VEND partner deletion failed:",
        deletePartnerError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to delete the VEND partner record.",
        },
        { status: 500 }
      );
    }

    /*
     * Remove the profile.
     */
    if (partner.profile_id) {
      const { error: profileDeleteError } =
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", partner.profile_id);

      if (profileDeleteError) {
        console.error(
          "VEND profile deletion failed:",
          profileDeleteError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "VEND partner record was removed, but the profile could not be deleted. Manual cleanup may be required.",
          },
          { status: 500 }
        );
      }

      /*
       * Finally remove the Supabase Auth account.
       */
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(
          partner.profile_id
        );

      if (authDeleteError) {
        console.error(
          "VEND Auth deletion failed:",
          authDeleteError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "VEND records were removed, but the authentication account could not be deleted. Manual cleanup may be required.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${partner.full_name} (${partner.vend_code}) was permanently deleted.`,
    });
  } catch (error) {
    console.error(
      "Admin VEND management error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete the VEND management action.",
      },
      { status: 500 }
    );
  }
}
