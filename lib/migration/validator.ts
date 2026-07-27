/**
 * PoultryOps Migration — Validator
 *
 * Phase A: Row-level validation, date parsing, and duplicate detection.
 *
 * Validation layers:
 * 1. Required field validation
 * 2. Date validation (Excel serial, YYYY-MM-DD, DD/MM/YYYY)
 * 3. Numeric validation (integer, numeric, currency)
 * 4. Negative-value validation where inappropriate
 * 5. Enum validation (allowed values)
 * 6. Flock resolution (name → flock_id)
 * 7. Duplicate detection (data-type specific fingerprints)
 *
 * No database writes occur during validation.
 */

import { parseCurrency } from "./currency";
import type {
  ColumnMapping,
  CurrencyParseResult,
  DuplicateRule,
  MigrationDataType,
  RowStatus,
  RowValidation,
  SheetValidationResult,
} from "./types";
import { SHEET_TEMPLATES } from "./templates";

// ── Duplicate Detection Rules ───────────────────────────────────────────

/**
 * Data-type specific duplicate detection rules.
 *
 * Each rule defines the fields that together form a unique fingerprint.
 * Two rows with the same fingerprint are considered potential duplicates.
 *
 * Rules are designed to account for legitimate multiple records:
 * - Egg production: same date + flock is a duplicate (one record per day per flock)
 * - Feed consumption: same date + flock + feed_type is a duplicate
 * - Feed purchases: same date + feed_type + quantity is a duplicate
 * - Health: same date + flock + treatment is a duplicate
 * - Mortality: same date + flock + reason is a duplicate
 * - Sales: same date + item_type + quantity + unit_price is a duplicate
 * - Expenses: same date + category + amount is a duplicate
 * - Flocks: same flock_name is a duplicate
 */
export const DUPLICATE_RULES: Record<MigrationDataType, DuplicateRule> = {
  flocks: {
    dataType: "flocks",
    fields: ["flock_name"],
  },
  egg_production: {
    dataType: "egg_production",
    fields: ["production_date", "flock_name"],
  },
  feed_consumption: {
    dataType: "feed_consumption",
    fields: ["feed_date", "flock_name", "feed_type"],
  },
  feed_purchases: {
    dataType: "feed_purchases",
    fields: ["purchase_date", "feed_type", "quantity_kg"],
  },
  health: {
    dataType: "health",
    fields: ["health_date", "flock_name", "treatment_name"],
  },
  mortality: {
    dataType: "mortality",
    fields: ["mortality_date", "flock_name", "reason"],
  },
  sales: {
    dataType: "sales",
    fields: ["sale_date", "item_type", "quantity", "unit_price"],
  },
  expenses: {
    dataType: "expenses",
    fields: ["expense_date", "category", "amount"],
  },
};

// ── Date Parsing ────────────────────────────────────────────────────────

/**
 * Parse a date value from a spreadsheet cell.
 *
 * Supports:
 * - Excel serial dates (numbers like 46057)
 * - YYYY-MM-DD strings
 * - DD/MM/YYYY strings
 * - MM/DD/YYYY strings (if unambiguous)
 * - ISO date strings
 *
 * @returns Parsed date in YYYY-MM-DD format, or null if invalid
 */
export function parseDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  /**
   * Convert an Excel serial date to YYYY-MM-DD.
   *
   * Excel dates are stored as the number of days since its epoch.
   * Workbook parsing may return the serial either as a number
   * (46228) or as a numeric string ("46228"), so both must be handled.
   */
  const convertExcelSerial = (serial: number): string | null => {
    // Restrict this to a sensible Excel-date range.
    // This prevents ordinary small numeric values from being
    // accidentally interpreted as dates.
    if (!Number.isFinite(serial) || serial < 1 || serial > 100000) {
      return null;
    }

    // Excel epoch, accounting for Excel's historical 1900 date system.
    const excelEpoch = Date.UTC(1899, 11, 30);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const date = new Date(
      excelEpoch + Math.floor(serial) * millisecondsPerDay,
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().split("T")[0];
  };

  // Excel serial supplied as an actual number
  if (typeof value === "number" && !Number.isNaN(value)) {
    return convertExcelSerial(value);
  }

  const str = String(value).trim();

  if (str === "") {
    return null;
  }

  // Excel serial supplied as a numeric string, e.g. "46228"
  if (/^\d+(?:\.\d+)?$/.test(str)) {
    const serial = Number(str);

    // Typical modern Excel dates are well above 1000.
    // This avoids treating values such as "25" as Excel dates.
    if (serial >= 1000 && serial <= 100000) {
      return convertExcelSerial(serial);
    }
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    // Verify that JavaScript did not silently roll an invalid date
    // such as 2026-02-31 into another month.
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return str;
    }

    return null;
  }

  // DD/MM/YYYY
  const slashMatch = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  );

  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }

    return null;
  }

  // Last-resort parsing for recognised textual dates.
  // Numeric-only strings have already been handled above and
  // therefore cannot accidentally become huge years.
  const date = new Date(str);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return null;
}

// ── Flock Name Normalization ─────────────────────────────────────────────

/**
 * Normalize a flock name for matching purposes.
 *
 * - Trim leading/trailing whitespace
 * - Collapse repeated internal whitespace
 * - Lowercase for comparison
 *
 * Preserves original name for display/storage.
 *
 * @param flockName - The flock name to normalize
 * @returns Normalized flock name for matching
 */
export function normalizeFlockName(flockName: string): string {
  return flockName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ── Row Validation ────────────────────────────────────────────────────────

/**
 * Validate a single row against a data type's field definitions.
 *
 * @param row - The raw row data (object with source column names as keys)
 * @param dataType - The PoultryOps data type
 * @param mappings - Column mappings for this data type
 * @param flockMap - Map of flock_name → flock_id (for flock resolution)
 * @param existingFingerprints - Set of fingerprints already seen (for duplicate detection)
 * @returns RowValidation result
 */
export function validateRow(
  row: Record<string, any>,
  dataType: MigrationDataType,
  mappings: ColumnMapping[],
  flockMap: Record<string, string>,
  existingFingerprints: Set<string>,
): RowValidation {
  const template = SHEET_TEMPLATES[dataType];
  const errors: string[] = [];
  const warnings: string[] = [];
  const mappedData: Record<string, any> = {};

  // Build a lookup: poultryOpsField → sourceColumn
  const fieldToSource = new Map<string, string>();
  const specialValues = new Map<string, string>();

  for (const mapping of mappings) {
    fieldToSource.set(mapping.poultryOpsField, mapping.sourceColumn);
    const specialValue = (mapping as any)._specialValue;
    if (specialValue) {
      specialValues.set(mapping.poultryOpsField, specialValue);
    }
  }

  // Map source columns to PoultryOps fields
  for (const field of template.fields) {
    const sourceColumn = fieldToSource.get(field.field);

    if (sourceColumn) {
      mappedData[field.field] = row[sourceColumn];
    } else if (field.default !== undefined) {
      mappedData[field.field] = field.default;
    }
  }

  // Apply special values (e.g., "Bird Sold" → item_type = "Live Bird Sales")
  for (const [field, value] of Array.from(specialValues.entries())) {
    mappedData[field] = value;
  }

  // Validate each field
  for (const field of template.fields) {
    const value = mappedData[field.field];
    const isPresent =
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "";

    // Required field check
    if (field.required && !isPresent) {
      errors.push(`Missing required field: ${field.label}`);
      continue;
    }

    if (!isPresent) {
      continue; // Optional field, skip validation
    }

    // Type-specific validation
    switch (field.type) {
      case "integer": {
        const cleaned = String(value).replace(/[^0-9.-]/g, "");
        const num = parseInt(cleaned, 10);
        if (Number.isNaN(num)) {
          errors.push(`Invalid integer for ${field.label}: "${value}"`);
        } else if (num < 0) {
          errors.push(`Negative value not allowed for ${field.label}: ${num}`);
        } else {
          mappedData[field.field] = num;
        }
        break;
      }

      case "numeric": {
        const cleaned = String(value).replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        if (Number.isNaN(num)) {
          errors.push(`Invalid number for ${field.label}: "${value}"`);
        } else if (num < 0) {
          errors.push(`Negative value not allowed for ${field.label}: ${num}`);
        } else {
          mappedData[field.field] = num;
        }
        break;
      }

      case "currency": {
        const result = parseCurrency(value);
        if (result.error) {
          errors.push(
            `Invalid currency for ${field.label}: "${value}" (${result.error})`,
          );
        } else if (result.value !== null && result.value < 0) {
          errors.push(
            `Negative value not allowed for ${field.label}: ${result.value}`,
          );
        } else {
          mappedData[field.field] = result.value;
        }
        break;
      }

      case "date": {
        const parsed = parseDate(value);
        if (parsed === null) {
          errors.push(`Invalid date for ${field.label}: "${value}"`);
        } else {
          mappedData[field.field] = parsed;
        }
        break;
      }

      case "enum": {
        if (field.allowedValues) {
          const normalized = String(value).trim();
          if (!field.allowedValues.includes(normalized)) {
            warnings.push(
              `Unknown value for ${field.label}: "${value}" ` +
                `(allowed: ${field.allowedValues.join(", ")})`,
            );
          }
        }
        break;
      }

      case "string":
      default:
        // String fields — just trim
        mappedData[field.field] = String(value).trim();
        break;
    }
  }

// Flock resolution
//
// Rows in the Flocks sheet DEFINE flocks, so they must not be required
// to already exist in PoultryOps or in the flock map.
//
// All other data types that reference a flock must resolve their
// flock_name against either:
// 1. an existing PoultryOps flock, or
// 2. a flock being created by this workbook.
if (mappedData.flock_name && dataType !== "flocks") {
  const normalizedFlockName = String(mappedData.flock_name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const flockId = flockMap[normalizedFlockName];

  if (!flockId) {
    errors.push(`Flock not found: "${mappedData.flock_name}"`);
  } else {
    mappedData.flock_id = flockId;
  }
}

  // Duplicate detection
  const rule = DUPLICATE_RULES[dataType];
  const fingerprint = rule.fields
    .map((f) => String(mappedData[f] ?? ""))
    .join("|");
  const isDuplicate = existingFingerprints.has(fingerprint);

  if (isDuplicate) {
    warnings.push(
      `Possible duplicate within this workbook: ${rule.fields.join(", ")} match another row`,
    );
  }

  // Determine row status
  let status: RowStatus;
  if (errors.length > 0) {
    status = "error";
  } else if (warnings.length > 0) {
    status = "warning";
  } else {
    status = "valid";
  }

  return {
    rowIndex: 0, // Set by the caller (validateSheet)
    status,
    errors,
    warnings,
    mappedData,
    isDuplicate,
  };
}

// ── Sheet Validation ──────────────────────────────────────────────────────

/**
 * Validate all rows in a sheet for a specific data type.
 *
 * @param sheetName - Name of the sheet
 * @param dataType - PoultryOps data type
 * @param rows - Array of row objects
 * @param mappings - Column mappings
 * @param flockMap - Map of flock_name → flock_id
 * @returns SheetValidationResult
 */
export function validateSheet(
  sheetName: string,
  dataType: MigrationDataType,
  rows: Record<string, any>[],
  mappings: ColumnMapping[],
  flockMap: Record<string, string>,
): SheetValidationResult {
  const existingFingerprints = new Set<string>();
  const rowResults: RowValidation[] = [];

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const result = validateRow(
      row,
      dataType,
      mappings,
      flockMap,
      existingFingerprints,
    );
    // Row 1 is the header, so data starts at row 2
    result.rowIndex = index + 2;

    if (result.status === "valid") {
      validCount++;
    } else if (result.status === "warning") {
      warningCount++;
    } else {
      errorCount++;
    }

    if (result.isDuplicate) {
      duplicateCount++;
    }

    // Add fingerprint to set for subsequent duplicate detection
    const rule = DUPLICATE_RULES[dataType];
    const fingerprint = rule.fields
      .map((f) => String(result.mappedData[f] ?? ""))
      .join("|");
    existingFingerprints.add(fingerprint);

    rowResults.push(result);
  });

  return {
    sheetName,
    dataType,
    totalRows: rows.length,
    validRows: validCount,
    warningRows: warningCount,
    errorRows: errorCount,
    duplicateRows: duplicateCount,
    rows: rowResults,
    columnMappings: mappings,
  };
}

// ── Re-export parseCurrency for convenience ──────────────────────────────

export { parseCurrency };
export type { CurrencyParseResult };
