import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  msSinceLastVendVerificationEmail,
  sendVendVerificationEmail,
} from "@/lib/email-service";

const GENERIC_RESPONSE =
  "If the email belongs to an unverified PoultryOps VEND account, a verification email has been sent.";

// Short resend cooldown — 5 minutes.
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      // Generic response — do not reveal whether the account exists.
      return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
    }

    // ---------------------------------------------------------
    // Find the profile by email — must be a VEND profile.
    // ---------------------------------------------------------
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "vend") {
      return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
    }

    // ---------------------------------------------------------
    // Load the VEND partner for the code (never returned).
    // ---------------------------------------------------------
    const { data: partner } = await supabaseAdmin
      .from("vend_partners")
      .select("vend_code, full_name")
      .eq("profile_id", profile.id)
      .maybeSingle();

    // ---------------------------------------------------------
    // Check Auth confirmation state. getUserById is authoritative.
    // ---------------------------------------------------------
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authError || !authData?.user) {
      return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
    }

    if (authData.user.email_confirmed_at) {
      // Already verified — generic response, no details.
      return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
    }

    // ---------------------------------------------------------
    // Cooldown based on the most recent successful send.
    // ---------------------------------------------------------
    try {
      const msSinceLast = await msSinceLastVendVerificationEmail(profile.id);

      if (msSinceLast !== null && msSinceLast < RESEND_COOLDOWN_MS) {
        return NextResponse.json({
          success: true,
          message: GENERIC_RESPONSE,
        });
      }
    } catch (cooldownError) {
      console.error("VEND resend cooldown lookup failed:", cooldownError);
      // Fall through and attempt the send — fail open on lookup error.
    }

    // ---------------------------------------------------------
    // Generate a fresh verification link and send it.
    //
    // type "magiclink" for an existing unconfirmed user regenerates
    // a usable verification link without touching the password
    // (no password is available or needed here).
    // ---------------------------------------------------------
    const frontendUrl = (
      process.env.FRONTEND_URL || "https://poultry.trueops.app"
    ).replace(/\/$/, "");

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: authData.user.email || email,
        options: {
          redirectTo: `${frontendUrl}/auth/callback?next=/login?verified=1`,
        },
      });

    const actionLink = linkData?.properties?.action_link || null;

    if (linkError || !actionLink) {
      if (linkError) {
        console.error("VEND resend link generation failed:", linkError);
      }
      // Do not reveal internals — generic response.
      return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
    }

    try {
      await sendVendVerificationEmail(
        profile.id,
        email,
        partner?.full_name || profile.full_name || "",
        partner?.vend_code || "",
        actionLink
      );
    } catch (sendError) {
      console.error("VEND resend verification email failed:", sendError);
    }

    return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
  } catch (error) {
    console.error("VEND resend verification error:", error);

    return NextResponse.json({ success: true, message: GENERIC_RESPONSE });
  }
}
