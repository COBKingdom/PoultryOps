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
import { getAuthContext, buildFlockMap, getFarmFlocks } from "@/lib/migration/auth";
import { validateWorkbook, parseWorkbookRows, normalizeFlockName } from "@/lib/migration";
import { checkAllExistingDuplicates } from "@/lib/migration/duplicates";

export async function POST(req: Request) {
  // Step 1: Verify the PoultryOps Supabase access token
  // and derive the authorised farm server-side.
  const auth = await getAuthContext(req);

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

  // Step 4: Build flock map from the authorised farm (existing flocks)
  const existingFlockMap = await buildFlockMap(auth.authorisedFarmId!);

  // Step 5: Parse workbook rows to extract flock names from Flocks sheet
  const sheetRows = parseWorkbookRows(arrayBuffer);
  
  // Extract flock names from the Flocks sheet (if present)
  const workbookFlockNames: string[] = [];
  for (const [sheetName, rows] of Object.entries(sheetRows)) {
    if (sheetName.toLowerCase() === "flocks" || sheetName.toLowerCase() === "flock") {
      const typedRows = rows as Record<string, any>[];
      for (const row of typedRows) {
        const flockName = row.flock_name || row["flock name"] || row.name;
        if (flockName && String(flockName).trim()) {
          // Normalize for consistent matching
          workbookFlockNames.push(normalizeFlockName(String(flockName).trim()));
        }
      }
    }
  }

  // Step 6: Build combined flock map (existing + workbook flocks)
  // Workbook flocks are marked as pending (not yet in DB)
  const combinedFlockMap = { ...existingFlockMap };
  for (const flockName of workbookFlockNames) {
    // Add to map with a placeholder ID (will be created during import)
    // The validator will recognize these as valid flock references
    if (!combinedFlockMap[flockName]) {
      combinedFlockMap[flockName] = `pending:${flockName}`;
    }
  }

  // Step 7: Parse, detect, and validate (read-only — no database writes)
  const validationResult = validateWorkbook(arrayBuffer, combinedFlockMap);

  // Step 8: Check for existing-database duplicates (farm-scoped)
  const validationWithDuplicates = await checkAllExistingDuplicates(
    validationResult.sheets,
    auth.authorisedFarmId!,
  );

  // Step 9: Return validation results for preview
  // Note: authorisedFarmId and userId are NOT returned (security hardening)
  return NextResponse.json({
    success: true,
    userEmail: auth.userEmail,
    sheets: validationWithDuplicates,
  });
}
