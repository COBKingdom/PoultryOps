import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.statusCode || 403,
        }
      );
    }

    const body = await request.json();

    const partnerId = String(body.partnerId || "").trim();
    const action = String(body.action || "").trim().toLowerCase();

    if (!partnerId) {
      return NextResponse.json(
        {
          success: false,
          error: "POGP partner ID is required",
        },
        { status: 400 }
      );
    }

    if (!["deactivate", "reactivate", "delete"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid management action",
        },
        { status: 400 }
      );
    }

    const { data: partner, error: partnerError } =
      await supabaseAdmin
        .from("pogp_partners")
        .select(
          "id, profile_id, full_name, email, pogp_code, status"
        )
        .eq("id", partnerId)
        .maybeSingle();

    if (partnerError) {
      console.error("POGP partner lookup failed:", partnerError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load POGP partner",
        },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: "POGP partner not found",
        },
        { status: 404 }
      );
    }

    // ==========================================================
    // DEACTIVATE
    // ==========================================================

    if (action === "deactivate") {
      const { error: partnerUpdateError } =
        await supabaseAdmin
          .from("pogp_partners")
          .update({ status: "inactive" })
          .eq("id", partner.id);

      if (partnerUpdateError) {
        console.error(
          "POGP partner deactivation failed:",
          partnerUpdateError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to deactivate POGP partner",
          },
          { status: 500 }
        );
      }

      if (partner.profile_id) {
        const { error: profileError } =
          await supabaseAdmin
            .from("profiles")
            .update({ status: "inactive" })
            .eq("id", partner.profile_id);

        if (profileError) {
          console.error(
            "POGP profile deactivation failed:",
            profileError
          );
        }

        const { error: authError } =
          await supabaseAdmin.auth.admin.updateUserById(
            partner.profile_id,
            {
              ban_duration: "876000h",
            }
          );

        if (authError) {
          console.error(
            "POGP Auth deactivation failed:",
            authError
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `${partner.full_name || "POGP partner"} has been deactivated`,
      });
    }

    // ==========================================================
    // REACTIVATE
    // ==========================================================

    if (action === "reactivate") {
      const { error: partnerUpdateError } =
        await supabaseAdmin
          .from("pogp_partners")
          .update({ status: "active" })
          .eq("id", partner.id);

      if (partnerUpdateError) {
        console.error(
          "POGP partner reactivation failed:",
          partnerUpdateError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to reactivate POGP partner",
          },
          { status: 500 }
        );
      }

      if (partner.profile_id) {
        const { error: profileError } =
          await supabaseAdmin
            .from("profiles")
            .update({ status: "active" })
            .eq("id", partner.profile_id);

        if (profileError) {
          console.error(
            "POGP profile reactivation failed:",
            profileError
          );
        }

        const { error: authError } =
          await supabaseAdmin.auth.admin.updateUserById(
            partner.profile_id,
            {
              ban_duration: "none",
            }
          );

        if (authError) {
          console.error(
            "POGP Auth reactivation failed:",
            authError
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `${partner.full_name || "POGP partner"} has been reactivated`,
      });
    }

    // ==========================================================
    // DELETE
    // ==========================================================
    // Historical referral/commission records must be preserved.
    // If history exists, deletion is blocked and deactivation
    // should be used instead.
    // ==========================================================

    const {
      count: attributionCount,
      error: attributionError,
    } = await supabaseAdmin
      .from("pogp_attributions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("pogp_id", partner.id);

    if (attributionError) {
      console.error(
        "POGP attribution check failed:",
        attributionError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify POGP referral history",
        },
        { status: 500 }
      );
    }

    const {
      count: commissionCount,
      error: commissionError,
    } = await supabaseAdmin
      .from("pogp_commissions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("pogp_id", partner.id);

    if (commissionError) {
      console.error(
        "POGP commission check failed:",
        commissionError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify POGP commission history",
        },
        { status: 500 }
      );
    }

    if (
      (attributionCount || 0) > 0 ||
      (commissionCount || 0) > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This POGP cannot be deleted because referral or commission history exists. Deactivate the partner instead.",
          attributionCount: attributionCount || 0,
          commissionCount: commissionCount || 0,
        },
        { status: 409 }
      );
    }

    const { error: deletePartnerError } =
      await supabaseAdmin
        .from("pogp_partners")
        .delete()
        .eq("id", partner.id);

    if (deletePartnerError) {
      console.error(
        "POGP partner deletion failed:",
        deletePartnerError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to delete POGP partner. No historical records were removed.",
        },
        { status: 500 }
      );
    }

    if (partner.profile_id) {
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", partner.profile_id);

      if (profileError) {
        console.error(
          "POGP profile cleanup failed:",
          profileError
        );
      }

      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(
          partner.profile_id
        );

      if (authError) {
        console.error(
          "POGP Auth cleanup failed:",
          authError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${partner.full_name || "POGP partner"} has been deleted`,
    });
  } catch (error) {
    console.error("POGP management error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
