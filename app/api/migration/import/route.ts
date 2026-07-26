/**
 * PoultryOps Migration — Import API Route
 *
 * Phase B: Secure batch import endpoint.
 *
 * This route replaces the existing insecure import endpoint.
 *
 * Security:
 * - Establishes authenticated user server-side via @supabase/ssr
 * - Derives authorisedFarmId from the profiles table (NEVER from client)
 * - Verifies flock ownership for defaultFlockId
 * - All writes use authorisedFarmId
 * - Fixes the existing expenses farm_id:null bug
 *
 * Import flow:
 * 1. Authenticate user → derive authorisedFarmId
 * 2. Receive file + selected targets + options
 * 3. Re-parse and re-validate (read-only)
 * 4. Filter to selected targets
 * 5. Verify defaultFlockId belongs to authorised farm
 * 6. Execute batch import (100 rows per batch)
 * 7. Return accurate inserted/skipped/failed counts
 *
 * No timestamp-based rollback. No silent overwrites.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAuthContext,
  buildFlockMap,
  resolveFlockById,
} from "@/lib/migration/auth";
import { validateWorkbook, parseWorkbookRows } from "@/lib/migration";
import { checkAllExistingDuplicates } from "@/lib/migration/duplicates";
import {
  executeImport,
  type ImportTarget,
  type ImportOptions,
} from "@/lib/migration/importer";

export async function POST(req: Request) {
  // Step 1: Establish authenticated user and authorised farm
  const auth = await getAuthContext(cookies);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const authorisedFarmId = auth.authorisedFarmId!;

  // Step 2: Get the uploaded file and options
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  // Parse targets and options from form data
  const targetsJson = formData.get("targets") as string | null;
  const optionsJson = formData.get("options") as string | null;

  let targets: { sheetName: string; dataType: string }[] = [];
  let options: Partial<ImportOptions> = {};

  if (targetsJson) {
    try {
      targets = JSON.parse(targetsJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid targets JSON" },
        { status: 400 },
      );
    }
  }

  if (optionsJson) {
    try {
      options = JSON.parse(optionsJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid options JSON" },
        { status: 400 },
      );
    }
  }

  // Step 3: Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Step 4: Build flock map from the authorised farm
  const existingFlockMap = await buildFlockMap(authorisedFarmId);

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
          workbookFlockNames.push(String(flockName).trim());
        }
      }
    }
  }

  // Step 6: Build combined flock map (existing + workbook flocks)
  const combinedFlockMap = { ...existingFlockMap };
  for (const flockName of workbookFlockNames) {
    if (!combinedFlockMap[flockName]) {
      combinedFlockMap[flockName] = `pending:${flockName}`;
    }
  }

  // Step 7: Re-parse and re-validate (read-only — no database writes)
  const validationResult = validateWorkbook(arrayBuffer, combinedFlockMap);

  // Step 8: Check for existing-database duplicates (farm-scoped)
  const validationWithDuplicates = await checkAllExistingDuplicates(
    validationResult.sheets,
    authorisedFarmId,
  );

  // Step 9: Filter to selected targets
  const selectedTargets: ImportTarget[] = [];

  for (const target of targets) {
    const sheetResult = validationWithDuplicates.find(
      (s) =>
        s.sheetName === target.sheetName &&
        s.dataType === target.dataType,
    );

    if (sheetResult) {
      selectedTargets.push({
        sheetName: sheetResult.sheetName,
        dataType: sheetResult.dataType,
        rows: sheetResult.rows,
      });
    }
  }

  if (selectedTargets.length === 0) {
    return NextResponse.json(
      { error: "No valid targets selected for import" },
      { status: 400 },
    );
  }

  // Step 7: Verify defaultFlockId belongs to the authorised farm
  let verifiedDefaultFlockId: string | undefined;

  if (options.defaultFlockId) {
    const flock = await resolveFlockById(
      options.defaultFlockId,
      authorisedFarmId,
    );

    if (!flock) {
      return NextResponse.json(
        {
          error:
            "Invalid default flock: flock does not exist or does not belong to your farm",
        },
        { status: 403 },
      );
    }

    verifiedDefaultFlockId = flock.id;
  }

  // Step 8: Build import options with defaults
  const importOptions: ImportOptions = {
    batchSize: options.batchSize ?? 100,
    skipDuplicates: options.skipDuplicates ?? true,
    defaultFlockId: verifiedDefaultFlockId,
  };

  // Step 9: Execute the import
  const summary = await executeImport(
    selectedTargets,
    authorisedFarmId,
    combinedFlockMap,
    importOptions,
  );

  // Step 10: Return results (data minimisation - no internal IDs)
  return NextResponse.json({
    success: true,
    summary: {
      targets: summary.targets,
      totalInserted: summary.totalInserted,
      totalSkipped: summary.totalSkipped,
      totalFailed: summary.totalFailed,
    },
  });
}
