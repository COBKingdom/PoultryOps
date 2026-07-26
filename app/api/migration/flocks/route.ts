/**
 * PoultryOps Migration — Flocks API Route
 *
 * Phase B: Returns only flocks belonging to the authenticated user's
 * authorised farm.
 *
 * Security:
 * - Establishes authenticated user server-side via @supabase/ssr
 * - Derives authorisedFarmId from the profiles table
 * - NEVER trusts farm_id from the client
 * - Only returns flocks where farm_id = authorisedFarmId
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, getFarmFlocks } from "@/lib/migration/auth";

export async function GET() {
  // Step 1: Resolve cookies ONCE and establish authenticated user and authorised farm
  const cookieStore = await cookies();
  const auth = await getAuthContext(cookieStore);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  // Step 2: Get flocks for the authorised farm only
  const flocks = await getFarmFlocks(auth.authorisedFarmId!);

  return NextResponse.json({
    success: true,
    flocks,
  });
}
