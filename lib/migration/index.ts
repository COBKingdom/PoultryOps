/**
 * PoultryOps Migration — Core Service (Barrel)
 *
 * Phase A: Workbook parsing, detection, and validation orchestration.
 *
 * This module re-exports all migration submodules and provides the
 * top-level `parseWorkbook` and `validateWorkbook` functions.
 *
 * No database writes. No auth. No API routes.
 */

import * as XLSX from "xlsx";

import type {
  ColumnMapping,
  MigrationDataType,
  ParseResult,
  SheetMetadata,
  SheetValidationResult,
  ValidationResult,
} from "./types";
import { detectSheetTypes, detectColumns, detectSheets, normalizeHeader } from "./detector";
import { validateSheet } from "./validator";

// ── Re-exports ────────────────────────────────────────────────────────────

export type {
  ColumnMapping,
  CurrencyParseResult,
  DuplicateRule,
  FieldDefinition,
  FlockResolution,
  MappingConfidence,
  MigrationDataType,
  ParseResult,
  RowStatus,
  RowValidation,
  SheetMetadata,
  SheetTemplate,
  SheetValidationResult,
  SpecialMapping,
  ValidationResult,
} from "./types";

export {
  DUPLICATE_RULES,
  parseDate,
  parseCurrency,
  validateRow,
  validateSheet,
} from "./validator";

export {
  INSTRUCTIONS_CONTENT,
  INSTRUCTIONS_SHEET_NAME,
  MIGRATION_DATA_TYPES,
  SHEET_NAMES,
  SHEET_TEMPLATES,
} from "./templates";

export {
  detectColumns,
  detectSheetTypes,
  detectSheets,
  getField,
  getFields,
  normalizeHeader,
} from "./detector";

// ── Workbook Parsing ─────────────────────────────────────────────────────

/**
 * Parse an uploaded workbook and return sheet metadata.
 *
 * Uses the `xlsx` library to read the workbook, then detects
 * sheet types and column mappings for each sheet.
 *
 * Skips the "Instructions" sheet.
 *
 * @param data - File, ArrayBuffer, or Buffer containing the workbook
 * @returns ParseResult with sheet metadata
 */
export function parseWorkbook(
  data: File | ArrayBuffer | Buffer,
): ParseResult {
  let workbook: XLSX.WorkBook;

  if (data instanceof File) {
    // File objects need to be read as ArrayBuffer first
    // This function should be called with an ArrayBuffer in server contexts
    throw new Error(
      "parseWorkbook requires an ArrayBuffer or Buffer, not a File. " +
        "Use file.arrayBuffer() first.",
    );
  }

  workbook = XLSX.read(data, {
    // Preserve sheet names and cell values
    cellDates: false,
    cellNF: false,
    cellText: false,
    bookSheets: true,
    bookDeps: false,
  });

  // Build sheet data map for detection
  const sheetData: Record<string, any[][]> = {};
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    // Read as 2D array (header: 1) to get raw cell values
    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];
    sheetData[sheetName] = json;
  }

  // Detect sheets
  const sheets = detectSheets(workbook.SheetNames, sheetData);

  return { sheets };
}

/**
 * Parse a workbook and return sheet data as objects (for validation).
 *
 * Unlike `parseWorkbook` (which returns metadata), this function
 * returns the actual row data as objects keyed by header names.
 *
 * @param data - ArrayBuffer or Buffer containing the workbook
 * @returns Map of sheet name → array of row objects
 */
export function parseWorkbookRows(
  data: ArrayBuffer | Buffer,
): Record<string, Record<string, any>[]> {
  const workbook = XLSX.read(data, {
    cellDates: false,
    cellNF: false,
    cellText: false,
    bookSheets: true,
  });

  const result: Record<string, Record<string, any>[]> = {};

  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toLowerCase() === "instructions") {
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Read as array of objects (header row becomes keys)
    const json = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false, // Keep raw values (don't auto-convert dates)
    }) as Record<string, any>[];

    result[sheetName] = json;
  }

  return result;
}

// ── Full Validation Pipeline ─────────────────────────────────────────────

/**
 * Parse a workbook, detect data types, and validate all rows.
 *
 * This is the main entry point for the validation pipeline:
 * 1. Parse the workbook
 * 2. Detect sheet types and column mappings
 * 3. Validate each sheet for each detected data type
 *
 * @param data - ArrayBuffer or Buffer containing the workbook
 * @param flockMap - Map of flock_name → flock_id for flock resolution
 * @returns ValidationResult with per-sheet, per-data-type results
 */
export function validateWorkbook(
  data: ArrayBuffer | Buffer,
  flockMap: Record<string, string> = {},
): ValidationResult {
  // Step 1: Parse workbook metadata
  const parseResult = parseWorkbook(data);

  // Step 2: Parse workbook rows
  const sheetRows = parseWorkbookRows(data);

  // Step 3: Validate each sheet for each detected data type
  const results: SheetValidationResult[] = [];

  for (const sheet of parseResult.sheets) {
    const rows = sheetRows[sheet.sheetName] || [];

    for (const dataType of sheet.detectedTypes) {
      const mappings = sheet.mappings[dataType] || [];

      if (mappings.length === 0) {
        continue;
      }

      const result = validateSheet(
        sheet.sheetName,
        dataType,
        rows,
        mappings,
        flockMap,
      );

      results.push(result);
    }
  }

  return { sheets: results };
}

// ── Utility: Get sheet metadata for a specific data type ────────────────

/**
 * Find the sheet metadata for a specific data type.
 *
 * @param parseResult - Result from parseWorkbook
 * @param dataType - The data type to find
 * @returns SheetMetadata or undefined
 */
export function findSheetForDataType(
  parseResult: ParseResult,
  dataType: MigrationDataType,
): SheetMetadata | undefined {
  return parseResult.sheets.find(
    (s) => s.detectedTypes.includes(dataType),
  );
}

/**
 * Get all column mappings for a data type across all sheets.
 *
 * @param parseResult - Result from parseWorkbook
 * @param dataType - The data type to find mappings for
 * @returns Array of { sheetName, mappings }
 */
export function getAllMappingsForDataType(
  parseResult: ParseResult,
  dataType: MigrationDataType,
): { sheetName: string; mappings: ColumnMapping[] }[] {
  return parseResult.sheets
    .filter((s) => s.detectedTypes.includes(dataType))
    .map((s) => ({
      sheetName: s.sheetName,
      mappings: s.mappings[dataType] || [],
    }));
}
