import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Demo Visitor capture.
 *
 * Records WHO is using the EXISTING shared Demo account
 * (demo@poultryops.app / DEMO-001).
 *
 * This endpoint does NOT authenticate anything, does NOT touch
 * Supabase Auth, does NOT accept or process a password, and does not
 * modify any existing table.
 *
 * Visitor identity:
 *
 * The shared Demo authentication account cannot distinguish one
 * visitor from another, so the first capture issues an opaque
 * visitor_token. The browser stores that token and sends it back on
 * repeat access, which increments access_count instead of creating
 * another visitor record.
 */

const DEMO_FARM_CODE = "DEMO-001";
const DEMO_FARM_NAME = "PoultryOps Demo Farm";

const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Resolves the existing Demo farm using the same identification the
 * application already uses (farm_code DEMO-001, falling back to the
 * Demo farm name). No farm record is created or modified.
 */
async function resolveDemoFarmId(): Promise<string | null> {
  const { data: byCode, error: byCodeError } = await supabaseAdmin
    .from("farms")
    .select("id")
    .eq("farm_code", DEMO_FARM_CODE)
    .maybeSingle();

  if (byCodeError) {
    throw new Error(
      `Demo farm lookup failed: ${byCodeError.message}`
    );
  }

  if (byCode?.id) {
    return byCode.id;
  }

  const { data: byName, error: byNameError } = await supabaseAdmin
    .from("farms")
    .select("id")
    .eq("name", DEMO_FARM_NAME)
    .maybeSingle();

  if (byNameError) {
    throw new Error(
      `Demo farm lookup failed: ${byNameError.message}`
    );
  }

  return byName?.id ?? null;
}


export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;

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

    const visitorToken = cleanText(body.visitor_token).toLowerCase();
    const fullName = cleanText(body.full_name);
    const phone = cleanText(body.phone);

    // ----------------------------------------------------------
    // 1. Repeat access from a browser that already completed
    //    the Demo visitor capture.
    // ----------------------------------------------------------
    if (visitorToken && isUuid(visitorToken)) {
      const { data: existing, error: existingError } =
        await supabaseAdmin
          .from("demo_visitors")
          .select("id, access_count")
          .eq("visitor_token", visitorToken)
          .maybeSingle();

      if (existingError) {
        console.error(
          "Demo visitor lookup failed:",
          existingError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to record demo access",
          },
          { status: 500 }
        );
      }

      if (existing) {
        const updates: Record<string, unknown> = {
          last_access_at: new Date().toISOString(),
          access_count: (existing.access_count || 0) + 1,
        };

        // Only overwrite the captured identity when it is supplied.
        if (fullName) {
          updates.full_name = fullName.slice(
            0,
            MAX_NAME_LENGTH
          );
        }

        if (phone) {
          updates.phone = phone.slice(
            0,
            MAX_PHONE_LENGTH
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from("demo_visitors")
          .update(updates)
          .eq("id", existing.id);

        if (updateError) {
          console.error(
            "Demo visitor update failed:",
            updateError
          );

          return NextResponse.json(
            {
              success: false,
              error: "Unable to record demo access",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          visitor_token: visitorToken,
        });
      }
    }

    // ----------------------------------------------------------
    // 2. First capture.
    // ----------------------------------------------------------
    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name is required",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 }
      );
    }

    const demoFarmId = await resolveDemoFarmId();

    if (!demoFarmId) {
      console.error(
        "Demo farm could not be resolved (DEMO-001)"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Demo account is unavailable",
        },
        { status: 500 }
      );
    }

    const { data: created, error: insertError } =
      await supabaseAdmin
        .from("demo_visitors")
        .insert({
          full_name: fullName.slice(0, MAX_NAME_LENGTH),
          phone: phone.slice(0, MAX_PHONE_LENGTH),
          demo_farm_id: demoFarmId,
        })
        .select("id, visitor_token")
        .single();

    if (insertError || !created) {
      console.error(
        "Demo visitor insert failed:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to record demo access",
        },
        { status: 500 }
      );
    }

    // Only the minimum information the client needs.
    return NextResponse.json({
      success: true,
      visitor_token: created.visitor_token,
    });
  } catch (error) {
    console.error(
      "Demo visitor capture failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to record demo access",
      },
      { status: 500 }
    );
  }
}
