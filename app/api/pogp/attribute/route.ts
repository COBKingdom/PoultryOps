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
//    including user metadata.
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
        "[POGP attribution] Unable to retrieve authenticated user:",
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
    // 5. Read POGP referral code from the authenticated user's
    //    metadata.
    //
    //    We deliberately do NOT accept pogpCode from the request.
    // ==========================================================

const pogpCode =
  fullUser.user_metadata?.pogp_code
    ?.toString()
    .trim()
    .toUpperCase();

    if (!pogpCode) {
      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "no_referral_code",
      });
    }

    // ==========================================================
    // 6. Find an active POGP partner
    // ==========================================================

    const {
      data: partner,
      error: partnerError,
    } = await supabaseAdmin
      .from("pogp_partners")
      .select("id, pogp_code, status")
      .eq("pogp_code", pogpCode)
      .eq("status", "active")
      .maybeSingle();

    if (partnerError) {
      console.error(
        "[POGP attribution] Partner lookup failed:",
        partnerError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate POGP referral code",
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // 7. Invalid/inactive code
    //
    //    Do not prevent the farmer from completing registration.
    // ==========================================================

    if (!partner) {
      console.warn(
        `[POGP attribution] Invalid or inactive code: ${pogpCode}`
      );

      return NextResponse.json({
        success: true,
        attributed: false,
        reason: "invalid_referral_code",
        pogpCode,
      });
    }

    // ==========================================================
    // 8. Prevent duplicate attribution
    // ==========================================================

    const {
      data: existingAttribution,
      error: existingError,
    } = await supabaseAdmin
      .from("pogp_attributions")
      .select("id")
      .eq("farm_id", farmId)
      .maybeSingle();

    if (existingError) {
      console.error(
        "[POGP attribution] Existing attribution lookup failed:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to check existing POGP attribution",
        },
        { status: 500 }
      );
    }

    if (existingAttribution) {
      return NextResponse.json({
        success: true,
        attributed: true,
        alreadyAttributed: true,
        pogpCode,
      });
    }

    // ==========================================================
    // 9. Create permanent attribution
    // ==========================================================

    const {
      error: attributionError,
    } = await supabaseAdmin
      .from("pogp_attributions")
      .insert({
        pogp_id: partner.id,
        farm_id: farmId,
        source: "referral_code",
        attributed_at: new Date().toISOString(),
        notes: `Referral code: ${pogpCode}`,
      });

    if (attributionError) {
      console.error(
        "[POGP attribution] Insert failed:",
        attributionError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create POGP attribution",
        },
        { status: 500 }
      );
    }

    console.log(
      `[POGP attribution] ${farmId} attributed to ${pogpCode}`
    );

    return NextResponse.json({
      success: true,
      attributed: true,
      pogpCode,
    });
  } catch (error) {
    console.error(
      "[POGP attribution] Unexpected error:",
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