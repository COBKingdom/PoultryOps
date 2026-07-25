/**
 * PoultryOps Migration — Template Download API Route
 *
 * Phase C: Secure download endpoint for the standard PoultryOps workbook.
 *
 * Per Amendment 1, this endpoint is publicly accessible (no authentication
 * required) because the workbook is a generic template containing no
 * customer-specific information.
 *
 * Authentication remains required for:
 * - Parse / Validate (/api/migration/parse)
 * - Import (/api/migration/import)
 * - Flock retrieval (/api/migration/flocks)
 *
 * The workbook is generated dynamically on each request.
 * No static workbook files are stored in the repository.
 */

import { NextResponse } from "next/server";
import { generatePoultryOpsWorkbook } from "@/lib/migration/workbook";

export async function GET() {
  // Generate the workbook dynamically
  const buffer = generatePoultryOpsWorkbook();

  // Return as downloadable .xlsx file
  // Convert Buffer to Uint8Array for NextResponse compatibility
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="PoultryOps Migration Workbook.xlsx"',
      "Content-Length": buffer.length.toString(),
    },
  });
}
