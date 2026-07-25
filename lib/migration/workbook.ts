/**
 * PoultryOps Migration — Workbook Generator
 *
 * Phase C: Generates the standard PoultryOps migration workbook.
 *
 * This generator is metadata-driven and reusable across TrueOps products.
 * It accepts template metadata as parameters, so future products
 * (AquaOps, DairyOps, FeedOps, etc.) can use the same architecture
 * with their own metadata.
 *
 * Features:
 * - Instructions sheet with structured sections
 * - Data sheets with human-friendly headers (not raw DB field names)
 * - Required fields marked with * prefix
 * - Frozen header rows
 * - Auto-width columns
 * - Headers only (no example data rows)
 * - Allowed values derived from FieldDefinition metadata
 *
 * xlsx Library (v0.18.5) Capabilities:
 * - Frozen panes: Supported (!freeze)
 * - Column widths: Supported (!cols with wch)
 * - Bold headers: NOT supported in Community Edition
 * - Dropdown validation: NOT supported in Community Edition
 *
 * No new dependencies introduced.
 */

import * as XLSX from "xlsx";
import type {
  MigrationDataType,
  SheetTemplate,
} from "./types";
import {
  MIGRATION_DATA_TYPES,
  SHEET_TEMPLATES,
} from "./templates";

// ── Sheet Descriptions (for Instructions sheet) ──────────────────────────

/**
 * Human-readable descriptions for each worksheet.
 * This mapping is metadata — future TrueOps products can provide
 * their own descriptions when calling generateWorkbook().
 */
const SHEET_DESCRIPTIONS: Record<MigrationDataType, string> = {
  flocks: "Define your poultry flocks (processed first)",
  egg_production: "Daily egg collection records",
  feed_consumption: "Daily feed usage per flock",
  feed_purchases: "Feed inventory purchases",
  health: "Vaccinations, treatments, and medications",
  mortality: "Daily mortality records per flock",
  sales: "Egg sales, live bird sales, and other income",
  expenses: "General farm expenses",
};

// ── Options ─────────────────────────────────────────────────────────────

export interface WorkbookOptions {
  /** Product name displayed in the Instructions sheet */
  productName?: string;
  /** Whether to include a Farm Information sheet (placeholder for future) */
  includeFarmInfo?: boolean;
  /** Custom sheet descriptions (for future TrueOps products) */
  sheetDescriptions?: Partial<Record<MigrationDataType, string>>;
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Generate a workbook from metadata.
 *
 * This is the generic, reusable generator. It accepts template metadata
 * as parameters so future TrueOps products can use the same architecture
 * with their own metadata.
 *
 * @param templates - Record of data type to sheet template
 * @param dataTypes - Ordered array of data types (determines sheet order)
 * @param options - Workbook options
 * @returns Buffer containing the .xlsx file
 */
export function generateWorkbook(
  templates: Record<MigrationDataType, SheetTemplate>,
  dataTypes: MigrationDataType[],
  options: WorkbookOptions = {},
): Buffer {
  const {
    productName = "PoultryOps",
    includeFarmInfo = false,
    sheetDescriptions = {},
  } = options;

  // Merge default descriptions with custom ones
  const descriptions = { ...SHEET_DESCRIPTIONS, ...sheetDescriptions };

  const workbook = XLSX.utils.book_new();

  // 1. Instructions sheet (always first)
  const instructionsSheet = createInstructionsSheet(
    productName,
    templates,
    dataTypes,
    descriptions,
  );
  XLSX.utils.book_append_sheet(
    workbook,
    instructionsSheet,
    "Instructions",
  );

  // 2. Data sheets (in order)
  for (const dataType of dataTypes) {
    const template = templates[dataType];
    const sheet = createDataSheet(template);
    XLSX.utils.book_append_sheet(workbook, sheet, template.sheetName);
  }

  // 3. Optional Farm Information sheet (placeholder for future)
  if (includeFarmInfo) {
    const farmInfoSheet = createFarmInfoSheet();
    XLSX.utils.book_append_sheet(
      workbook,
      farmInfoSheet,
      "Farm Information",
    );
  }

  // 4. Write workbook to buffer
  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  }) as Buffer;
}

/**
 * Generate the standard PoultryOps workbook.
 *
 * Convenience wrapper around generateWorkbook() that uses the
 * PoultryOps template metadata from Phase A.
 *
 * @param options - Workbook options
 * @returns Buffer containing the .xlsx file
 */
export function generatePoultryOpsWorkbook(
  options: WorkbookOptions = {},
): Buffer {
  return generateWorkbook(
    SHEET_TEMPLATES,
    MIGRATION_DATA_TYPES,
    options,
  );
}

// ── Internal: Instructions Sheet ─────────────────────────────────────────

/**
 * Build the Instructions sheet content as a 2D array.
 *
 * Structured into clearly separated sections for easy scanning.
 * All content is derived from template metadata — no hard-coded
 * enum values or field descriptions.
 */
function buildInstructionsContent(
  productName: string,
  templates: Record<MigrationDataType, SheetTemplate>,
  dataTypes: MigrationDataType[],
  descriptions: Record<MigrationDataType, string>,
): string[][] {
  const rows: string[][] = [];

  // WELCOME
  rows.push(["WELCOME"]);
  rows.push([`${productName} Migration Workbook`]);
  rows.push([""]);

  // PURPOSE
  rows.push(["PURPOSE"]);
  rows.push([
    `This workbook is the standard import template for ${productName}.`,
  ]);
  rows.push(["Use it to import your farm data in bulk."]);
  rows.push([""]);

  // HOW TO USE
  rows.push(["HOW TO USE"]);
  rows.push(["Step 1: Fill in the data sheets with your farm data."]);
  rows.push(["Step 2: Save the workbook."]);
  rows.push([`Step 3: Upload the workbook to ${productName}.`]);
  rows.push(["Step 4: Review the preview and confirm the import."]);
  rows.push([""]);

  // WORKSHEETS
  rows.push(["WORKSHEETS"]);
  for (const dataType of dataTypes) {
    const template = templates[dataType];
    const desc = descriptions[dataType] ?? "";
    rows.push([`${template.sheetName}: ${desc}`]);
  }
  rows.push([""]);

  // FIELD GUIDANCE
  rows.push(["FIELD GUIDANCE"]);
  rows.push(["Fields marked with * are required."]);
  rows.push(["Optional fields can be left blank."]);
  rows.push(["Flock Name in operational sheets must correspond to a"]);
  rows.push(["flock being migrated or already belonging to your farm."]);
  rows.push(["Dates should use YYYY-MM-DD format (e.g., 2024-01-15)."]);
  rows.push([""]);

  // DATE FORMAT
  rows.push(["DATE FORMAT"]);
  rows.push(["Use YYYY-MM-DD format (e.g., 2024-01-15)"]);
  rows.push([""]);

  // CURRENCY
  rows.push(["CURRENCY"]);
  rows.push(["Recommended: enter monetary values as plain numbers"]);
  rows.push(["such as 5000 or 5,000."]);
  rows.push(["PoultryOps can also recognise common currency-formatted"]);
  rows.push(["values such as NGN 5,000 and ₦5,000."]);
  rows.push(["Database monetary values remain numeric."]);
  rows.push([""]);

  // ALLOWED VALUES (derived from FieldDefinition metadata)
  const allowedValuesRows = buildAllowedValuesSection(
    templates,
    dataTypes,
  );
  rows.push(...allowedValuesRows);
  rows.push([""]);

  // DUPLICATE DETECTION
  rows.push(["DUPLICATE DETECTION"]);
  rows.push(["PoultryOps checks imported records for likely duplicates"]);
  rows.push(["before import. Potential duplicates are flagged and"]);
  rows.push(["skipped by default. You can choose to import flagged"]);
  rows.push(["duplicates manually if needed."]);
  rows.push([""]);

  // SUPPORTED IMPORTS
  rows.push(["SUPPORTED IMPORTS"]);
  rows.push([
    dataTypes
      .map((dt) => templates[dt].sheetName)
      .join(", "),
  ]);
  rows.push([""]);

  // HELP
  rows.push(["HELP"]);
  rows.push([`For support, contact ${productName} support.`]);

  return rows;
}

/**
 * Build the ALLOWED VALUES section from FieldDefinition metadata.
 *
 * Iterates over all templates and extracts allowedValues from
 * enum-type fields. No values are hard-coded — everything comes
 * from the template metadata.
 */
function buildAllowedValuesSection(
  templates: Record<MigrationDataType, SheetTemplate>,
  dataTypes: MigrationDataType[],
): string[][] {
  const rows: string[][] = [];

  rows.push(["ALLOWED VALUES"]);

  for (const dataType of dataTypes) {
    const template = templates[dataType];
    const enumFields = template.fields.filter(
      (f) => f.allowedValues && f.allowedValues.length > 0,
    );

    if (enumFields.length === 0) continue;

    rows.push([`${template.sheetName}:`]);
    for (const field of enumFields) {
      rows.push([
        `  ${field.label}: ${field.allowedValues!.join(", ")}`,
      ]);
    }
  }

  return rows;
}

/**
 * Create the Instructions worksheet.
 */
function createInstructionsSheet(
  productName: string,
  templates: Record<MigrationDataType, SheetTemplate>,
  dataTypes: MigrationDataType[],
  descriptions: Record<MigrationDataType, string>,
): XLSX.WorkSheet {
  const rows = buildInstructionsContent(
    productName,
    templates,
    dataTypes,
    descriptions,
  );

  const sheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column width for the single content column
  sheet["!cols"] = [{ wch: 80 }];

  return sheet;
}

// ── Internal: Data Sheet ─────────────────────────────────────────────────

/**
 * Create a data worksheet from a template.
 *
 * - Uses human-friendly labels (field.label) as headers, NOT raw DB field names
 * - Required fields are prefixed with "* "
 * - Headers only — no example data rows
 * - Header row is frozen
 * - Column widths are auto-calculated
 */
function createDataSheet(template: SheetTemplate): XLSX.WorkSheet {
  // Build header row with human-friendly labels
  const headers = template.fields.map((field) => {
    const label = field.label;
    // Mark required fields with * prefix
    // The * is stripped by normalizeHeader in the detector,
    // so this remains compatible with the existing alias/mapping engine
    return field.required ? `* ${label}` : label;
  });

  // Create sheet with headers only (no data rows)
  const sheet = XLSX.utils.aoa_to_sheet([headers]);

  // Freeze the header row
  sheet["!freeze"] = { rows: 1 };

  // Set column widths based on header text length
  // Minimum 10, padding 2, maximum 50
  sheet["!cols"] = headers.map((h) => ({
    wch: Math.min(Math.max(h.length, 10) + 2, 50),
  }));

  return sheet;
}

// ── Internal: Farm Information Sheet (placeholder) ──────────────────────

/**
 * Create a Farm Information worksheet.
 *
 * This is a placeholder for future implementation.
 * The generator is structured so this sheet can be easily added
 * by setting includeFarmInfo: true in WorkbookOptions.
 */
function createFarmInfoSheet(): XLSX.WorkSheet {
  const headers = ["Farm Name", "Farm Type", "Currency"];

  const sheet = XLSX.utils.aoa_to_sheet([headers]);

  sheet["!freeze"] = { rows: 1 };

  sheet["!cols"] = headers.map((h) => ({
    wch: Math.min(h.length + 2, 50),
  }));

  return sheet;
}
