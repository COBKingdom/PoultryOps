import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const phone = normalizePhone(String(body.phone || ""));
    const email = normalizeEmail(String(body.email || ""));
    const territory = String(body.territory || "").trim();
    const pogpCode = body.pogpCode
      ? normalizeCode(String(body.pogpCode))
      : "";

    // ---------------------------------------------------------
    // Basic validation
    // ---------------------------------------------------------
    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone / WhatsApp number is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!territory) {
      return NextResponse.json(
        { error: "Territory or zone is required." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate optional recruiting POGP
    // ---------------------------------------------------------
    let recruitedByPogpId: string | null = null;

    if (pogpCode) {
      const { data: pogp, error: pogpError } = await supabaseAdmin
        .from("pogp_partners")
        .select("id, pogp_code, status")
        .eq("pogp_code", pogpCode)
        .eq("status", "active")
        .maybeSingle();

      if (pogpError) {
        console.error("VEND POGP lookup error:", pogpError);

        return NextResponse.json(
          { error: "Unable to validate the POGP referral code." },
          { status: 500 }
        );
      }

      if (!pogp) {
        return NextResponse.json(
          {
            error:
              "The POGP referral code is invalid or inactive. Please check the code and try again.",
          },
          { status: 400 }
        );
      }

      recruitedByPogpId = pogp.id;
    }

    // ---------------------------------------------------------
    // Prevent duplicate email
    // ---------------------------------------------------------
    const { data: existingEmail, error: emailLookupError } =
      await supabaseAdmin
        .from("vend_partners")
        .select("id, vend_code, full_name, status")
        .eq("email", email)
        .maybeSingle();

    if (emailLookupError) {
      console.error("VEND email lookup error:", emailLookupError);

      return NextResponse.json(
        { error: "Unable to check existing VEND records." },
        { status: 500 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "A VEND partner with this email already exists.",
          vendCode: existingEmail.vend_code,
          existing: true,
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // Prevent duplicate phone
    // ---------------------------------------------------------
    const { data: existingPhone, error: phoneLookupError } =
      await supabaseAdmin
        .from("vend_partners")
        .select("id, vend_code, full_name, status")
        .eq("phone", phone)
        .maybeSingle();

    if (phoneLookupError) {
      console.error("VEND phone lookup error:", phoneLookupError);

      return NextResponse.json(
        { error: "Unable to check existing VEND records." },
        { status: 500 }
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        {
          error: "A VEND partner with this phone number already exists.",
          vendCode: existingPhone.vend_code,
          existing: true,
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // Generate the next VEND number atomically
    // ---------------------------------------------------------
    const { data: sequenceData, error: sequenceError } =
      await supabaseAdmin.rpc("get_next_vend_number");

    if (sequenceError) {
      console.error("VEND sequence error:", sequenceError);

      return NextResponse.json(
        {
          error: "Unable to generate a VEND code. Please try again.",
        },
        { status: 500 }
      );
    }

    const nextNumber = Number(sequenceData);

    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      console.error(
        "Invalid VEND sequence value:",
        sequenceData
      );

      return NextResponse.json(
        {
          error: "Unable to generate a valid VEND code.",
        },
        { status: 500 }
      );
    }

    const vendCode = `VEND-${String(nextNumber).padStart(3, "0")}`;

    // ---------------------------------------------------------
    // Create VEND partner
    // ---------------------------------------------------------
    const { data: vend, error: insertError } = await supabaseAdmin
      .from("vend_partners")
      .insert({
        full_name: fullName,
        email,
        phone,
        territory,
        vend_code: vendCode,
        status: "active",
        recruited_by_pogp_id: recruitedByPogpId,
      })
      .select(
        "id, full_name, email, phone, territory, vend_code, status, recruited_by_pogp_id, joined_at"
      )
      .single();

    if (insertError) {
      console.error("VEND creation error:", insertError);

      return NextResponse.json(
        {
          error:
            "Unable to complete your VEND registration. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "VEND registration successful.",
        vend: {
          id: vend.id,
          fullName: vend.full_name,
          email: vend.email,
          phone: vend.phone,
          territory: vend.territory,
          vendCode: vend.vend_code,
          status: vend.status,
          recruitedByPogpId: vend.recruited_by_pogp_id,
          joinedAt: vend.joined_at,
        },
        referralUrl: `/register?ref=${encodeURIComponent(
          vend.vend_code
        )}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("VEND join API error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your registration.",
      },
      { status: 500 }
    );
  }
}