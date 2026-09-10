import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ==========================================================
    // 1. Authenticate the current user
    // ==========================================================

    const authResult =
      await getAuthenticatedUser(request);

    if (
      !authResult.success ||
      !authResult.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // ==========================================================
    // 2. Retrieve the full authenticated user record
    //    including referral metadata.
    // ==========================================================

    const {
      data: {
        user: fullUser,
      },
      error: fullUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      user.id
    );

    if (fullUserError || !fullUser) {
      console.error(
        "[VEND attribution] Unable to retrieve authenticated user:",
        fullUserError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve authenticated user",
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // 3. Read request
    // ==========================================================

    let body: {
      farmId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const farmId = body.farmId;

    if (!farmId) {
      return NextResponse.json(
        {
          success: false,
          error: "Farm ID is required",
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // 4. Verify that this farm belongs to the authenticated user
    // ==========================================================

    const {
      data: farm,
      error: farmError,
    } = await supabaseAdmin
      .from("farms")
      .select("id, owner_id")
      .eq("id", farmId)
      .single();

    if (farmError || !farm) {
      return NextResponse.json(
        {
          success: false,
          error: "Farm not found",
        },
        { status: 404 }
      );
    }

    if (farm.owner_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    // ==========================================================
    // 5. Read VEND referral code from authenticated user metadata.
    //
    //    We deliberately do NOT accept vendCode from the request.
    // ==========================================================

    const vendCode =
      fullUser.user_metadata?.vend_code
        ?.toString()
        .trim()
        .toUpperCase();

    if (!vendCode) {
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "no_referral_code",
      });
    }

    // ==========================================================
    // 6. Find active VEND partner
    // ==========================================================

    const {
      data: vend,
      error: vendError,
    } = await supabaseAdmin
      .from("vend_partners")
      .select(
        "id, vend_code, status, recruited_by_pogp_id"
      )
      .eq("vend_code", vendCode)
      .eq("status", "active")
      .maybeSingle();

    if (vendError) {
      console.error(
        "[VEND attribution] Partner lookup failed:",
        vendError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate VEND referral code",
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // 7. Invalid/inactive code
    //
    //    Do not prevent the farmer from completing registration.
    // ==========================================================

    if (!vend) {
      console.warn(
        `[VEND attribution] Invalid or inactive code: ${vendCode}`
      );

      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "invalid_referral_code",
        vendCode,
      });
    }

    // ==========================================================
    // 8. Prevent duplicate attribution
    // ==========================================================

    const {
      data: existingAttribution,
      error: existingError,
    } = await supabaseAdmin
      .from("vend_attributions")
      .select("id")
      .eq("farm_id", farmId)
      .maybeSingle();

    if (existingError) {
      console.error(
        "[VEND attribution] Existing attribution lookup failed:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to check existing VEND attribution",
        },
        { status: 500 }
      );
    }

    if (existingAttribution) {
      return NextResponse.json({
        success: true,
        attributed: true,
        alreadyAttributed: true,
        vendCode,
      });
    }

    // ==========================================================
    // 9. Create permanent VEND attribution
    // ==========================================================

    const {
      error: attributionError,
    } = await supabaseAdmin
      .from("vend_attributions")
      .insert({
        vend_id: vend.id,
        farm_id: farmId,
        source: "referral_code",
        attributed_at: new Date().toISOString(),
        notes: `Referral code: ${vendCode}`,
      });

    if (attributionError) {
      console.error(
        "[VEND attribution] Insert failed:",
        attributionError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create VEND attribution",
        },
        { status: 500 }
      );
    }

    console.log(
      `[VEND attribution] ${farmId} attributed to ${vendCode}`
    );

    return NextResponse.json({
      success: true,
      attributed: true,
      vendCode,
      vendId: vend.id,
      recruitedByPogpId:
        vend.recruited_by_pogp_id || null,
    });
  } catch (error) {
    console.error(
      "[VEND attribution] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
