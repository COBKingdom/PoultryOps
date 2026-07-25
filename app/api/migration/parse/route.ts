/**
 * PoultryOps Migration — Parse / Validate API Route
 *
 * Phase B: Parses an uploaded workbook, detects sheets/data types,
 * resolves the authorised farm context, loads authorised farm flocks,
 * validates rows, identifies warnings/errors, identifies potential
 * duplicates, and returns preview/validation data.
 *
 * This endpoint is READ-ONLY. It MUST NOT write operational records.
 *
 * Security:
 * - Establishes authenticated user server-side via @supabase/ssr
 * - Derives authorisedFarmId from the profiles table
 * - NEVER trusts farm_id from the client
 * - Only resolves flocks belonging to the authorised farm
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, buildFlockMap } from "@/lib/migration/auth";
import { validateWorkbook } from "@/lib/migration";

export async function POST(req: Request) {
  // Step 1: Establish authenticated user and authorised farm
  const auth = await getAuthContext(cookies);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  // Step 2: Get the uploaded file
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  // Step 3: Convert file to ArrayBuffer for xlsx parsing
  const arrayBuffer = await file.arrayBuffer();

  // Step 4: Build flock map from the authorised farm
  const flockMap = await buildFlockMap(auth.authorisedFarmId!);

  // Step 5: Parse, detect, and validate (read-only — no database writes)
  const validationResult = validateWorkbook(arrayBuffer, flockMap);

  // Step 6: Return validation results for preview
  return NextResponse.json({
    success: true,
    authorisedFarmId: auth.authorisedFarmId,
    userId: auth.userId,
    userEmail: auth.userEmail,
    sheets: validationResult.sheets,
  });
}
