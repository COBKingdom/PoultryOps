import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createVendUser,
  type CreateVendUserParams,
} from "@/lib/users/create-vend-user";

function getNextVendCode(existingCodes: string[]) {
  let maxNumber = 0;

  for (const code of existingCodes) {
    const match = String(code || "")
      .trim()
      .toUpperCase()
      .match(/^VEND-(\d+)$/);

    if (match) {
      maxNumber = Math.max(maxNumber, Number(match[1]));
    }
  }

  return `VEND-${String(maxNumber + 1).padStart(3, "0")}`;
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin(request);

    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const territory = String(body.territory || "").trim();
    const recruitedByPogpId = body.recruitedByPogpId
      ? String(body.recruitedByPogpId).trim()
      : null;

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name, email and phone are required.",
        },
        { status: 400 }
      );
    }

    const { data: existingVend, error: existingVendError } =
      await supabaseAdmin
        .from("vend_partners")
        .select("id, email, vend_code")
        .eq("email", email)
        .maybeSingle();

    if (existingVendError) {
      console.error(
        "Error checking existing VEND:",
        existingVendError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to check existing VEND records.",
        },
        { status: 500 }
      );
    }

    if (existingVend) {
      return NextResponse.json(
        {
          success: false,
          error: "A VEND partner already exists with this email address.",
        },
        { status: 409 }
      );
    }

    let recruitedByPogp: {
      id: string;
      pogp_code: string;
      full_name: string;
    } | null = null;

    if (recruitedByPogpId) {
      const { data: pogp, error: pogpError } = await supabaseAdmin
        .from("pogp_partners")
        .select("id, pogp_code, full_name, status")
        .eq("id", recruitedByPogpId)
        .maybeSingle();

      if (pogpError) {
        console.error("Error loading recruiting POGP:", pogpError);

        return NextResponse.json(
          {
            success: false,
            error: "Unable to validate the selected POGP.",
          },
          { status: 500 }
        );
      }

      if (!pogp) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected POGP could not be found.",
          },
          { status: 400 }
        );
      }

      if (pogp.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "The selected POGP is not active.",
          },
          { status: 400 }
        );
      }

      recruitedByPogp = {
        id: pogp.id,
        pogp_code: pogp.pogp_code,
        full_name: pogp.full_name,
      };
    }

    const { data: existingCodes, error: codesError } =
      await supabaseAdmin
        .from("vend_partners")
        .select("vend_code");

    if (codesError) {
      console.error("Error loading VEND codes:", codesError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate the next VEND code.",
        },
        { status: 500 }
      );
    }

    const vendCode = getNextVendCode(
      (existingCodes || []).map((row) => row.vend_code)
    );

    const params: CreateVendUserParams = {
      fullName,
      email,
      phone,
      territory: territory || undefined,
      vendCode,
      recruitedByPogpId: recruitedByPogp?.id || undefined,
    };

    const result = await createVendUser(params);

    return NextResponse.json(
      {
        success: true,
        message: "VEND partner created successfully.",
        vend: {
          id: result.partnerId,
          profile_id: result.userId,
          full_name: fullName,
          email,
          phone,
          territory: territory || null,
          vend_code: vendCode,
          status: "active",
          recruited_by_pogp_id: recruitedByPogp?.id || null,
          recruited_by_pogp: recruitedByPogp
            ? {
                id: recruitedByPogp.id,
                pogp_code: recruitedByPogp.pogp_code,
                full_name: recruitedByPogp.full_name,
              }
            : null,
        },
        temporaryPassword: result.temporaryPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin VEND creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create VEND partner.",
      },
      { status: 500 }
    );
  }
}
