/**
 * PoultryOps Migration — Column Detector
 *
 * Phase A: Header normalization, column detection, and sheet type detection.
 *
 * The detector normalizes spreadsheet headers and matches them against
 * PoultryOps field aliases. It supports:
 * - Standard PoultryOps column names (e.g., "flock_name", "egg_count")
 * - Legacy/SHOBAL column names (e.g., "Total Egg Production", "Feed Used")
 * - Special mappings (e.g., "Bird Sold" → item_type = "Live Bird Sales")
 *
 * The alias/detection architecture is extensible — new aliases can be
 * added to templates.ts without changing detector logic.
 */

import type {
  ColumnMapping,
  MigrationDataType,
  SheetMetadata,
} from "./types";
import { SHEET_TEMPLATES } from "./templates";

// ── Header Normalization ────────────────────────────────────────────────

/**
 * Normalize a header string for comparison.
 *
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes special characters (keeps alphanumeric and spaces)
 * - Collapses multiple spaces to single space
 *
 * Examples:
 *   "Total Egg Production" → "total egg production"
 *   "Feed Used Per Kg"     → "feed used per kg"
 *   "Date"                 → "date"
 *   "Bird Sold"            → "bird sold"
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Sheet Type Detection ────────────────────────────────────────────────

/**
 * Detect which PoultryOps data types a sheet's headers match.
 *
 * A sheet can match multiple data types (e.g., a daily farm sheet
 * containing egg production, feed, and mortality columns).
 *
 * Detection requires ALL required fields for a data type to be
 * matched via aliases.
 *
 * @param headers - Original headers from the spreadsheet
 * @returns Array of detected data types
 */
export function detectSheetTypes(headers: string[]): MigrationDataType[] {
  const normalized = headers.map(normalizeHeader);
  const detected: MigrationDataType[] = [];

  for (const dataType of Object.keys(SHEET_TEMPLATES) as MigrationDataType[]) {
    const template = SHEET_TEMPLATES[dataType];
    const requiredFields = template.fields.filter((f) => f.required);

    const allRequiredMatched = requiredFields.every((field) => {
      const aliases = [field.field, ...(field.aliases || [])].map(normalizeHeader);
      return normalized.some((h) => aliases.includes(h));
    });

    if (allRequiredMatched) {
      detected.push(dataType);
    }
  }

  return detected;
}

// ── Column Mapping ────────────────────────────────────────────────────────

/**
 * Detect column mappings for a specific data type.
 *
 * Matches spreadsheet headers against field aliases and special mappings.
 *
 * @param headers - Original headers from the spreadsheet
 * @param dataType - The PoultryOps data type to map
 * @returns Array of column mappings
 */
export function detectColumns(
  headers: string[],
  dataType: MigrationDataType,
): ColumnMapping[] {
  const template = SHEET_TEMPLATES[dataType];
  const normalized = headers.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));
  const mappings: ColumnMapping[] = [];

  for (const field of template.fields) {
    // Check special mappings first (e.g., "bird sold" → "Live Bird Sales")
    if (field.specialMappings) {
      for (const special of field.specialMappings) {
        const match = normalized.find(
          (h) => h.normalized === normalizeHeader(special.sourceColumn),
        );
        if (match) {
          mappings.push({
            sourceColumn: match.original,
            poultryOpsField: field.field,
            dataType,
            confidence: "auto",
          });
          // Mark this field as having a special value
          // The validator will use the special mapping value
          (mappings[mappings.length - 1] as any)._specialValue = special.value;
        }
      }
    }

    // Check regular aliases
    const aliases = [field.field, ...(field.aliases || [])].map(normalizeHeader);
    const match = normalized.find((h) => aliases.includes(h.normalized));

    if (match) {
      // Avoid duplicate mappings for the same field
      const existing = mappings.find(
        (m) => m.poultryOpsField === field.field,
      );
      if (!existing) {
        mappings.push({
          sourceColumn: match.original,
          poultryOpsField: field.field,
          dataType,
          confidence: "auto",
        });
      }
    }
  }

  return mappings;
}

// ── Sheet Metadata ────────────────────────────────────────────────────────

/**
 * Detect metadata for all sheets in a workbook.
 *
 * Skips the "Instructions" sheet.
 *
 * @param sheetNames - Array of sheet names
 * @param sheetData - Map of sheet name → array of rows (first row = headers)
 * @returns Array of sheet metadata
 */
export function detectSheets(
  sheetNames: string[],
  sheetData: Record<string, any[][]>,
): SheetMetadata[] {
  const results: SheetMetadata[] = [];

  for (const sheetName of sheetNames) {
    // Skip the Instructions sheet
    if (sheetName.toLowerCase() === "instructions") {
      continue;
    }

    const rows = sheetData[sheetName] || [];
    const headers: string[] = (rows[0] || []).map((h) =>
      h !== undefined && h !== null ? String(h) : "",
    );
    const normalizedHeaders = headers.map(normalizeHeader);
    const detectedTypes = detectSheetTypes(headers);
    const rowCount = Math.max(0, rows.length - 1); // subtract header row

    const mappings: Record<string, ColumnMapping[]> = {};
    for (const dataType of detectedTypes) {
      mappings[dataType] = detectColumns(headers, dataType);
    }

    results.push({
      sheetName,
      headers,
      normalizedHeaders,
      detectedTypes,
      rowCount,
      mappings,
    });
  }

  return results;
}

// ── Helper: Get field definition for a data type ─────────────────────────

import type { FieldDefinition } from "./types";

/**
 * Get all field definitions for a data type.
 */
export function getFields(dataType: MigrationDataType): FieldDefinition[] {
  return SHEET_TEMPLATES[dataType].fields;
}

/**
 * Get a specific field definition by field name.
 */
export function getField(
  dataType: MigrationDataType,
  fieldName: string,
): FieldDefinition | undefined {
  return SHEET_TEMPLATES[dataType].fields.find(
    (f) => f.field === fieldName,
  );
}
