/**
 * PoultryOps Migration — Existing-Database Duplicate Detection
 *
 * This module checks validated migration rows against existing records
 * in the authenticated farm's database to prevent accidental duplicate
 * imports.
 *
 * Responsibilities:
 * - Build fingerprints from validated rows
 * - Query existing farm records by fingerprint
 * - Return duplicate information for the parse API
 * - Remain farm-scoped (never cross-farm)
 * - Perform NO writes
 *
 * Separation of concerns:
 * - validator.ts handles workbook-internal validation
 * - This module handles existing-database duplicate detection
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import type {
  MigrationDataType,
  RowValidation,
  SheetValidationResult,
  DuplicateRule,
} from "./types";
import { DUPLICATE_RULES } from "./validator";

// ── Types ───────────────────────────────────────────────────────────────

export interface ExistingDuplicate {
  /** The fingerprint that matched */
  fingerprint: string;
  /** The existing record ID in the database */
  existingRecordId: string;
  /** The row index in the uploaded workbook */
  rowIndex: number;
  /** Minimal identifying fields for display (data minimisation) */
  existingRecord: {
    id: string;
    [key: string]: any;
  };
}

export interface DuplicateCheckResult {
  /** Data type that was checked */
  dataType: MigrationDataType;
  /** Map of fingerprint → existing duplicate info */
  duplicates: Map<string, ExistingDuplicate>;
  /** Total fingerprints checked */
  fingerprintsChecked: number;
  /** Total existing duplicates found */
  duplicatesFound: number;
}

// ── Fingerprint Building ────────────────────────────────────────────────

/**
 * Build a fingerprint string from mapped data using the duplicate rule.
 *
 * @param mappedData - The validated and mapped row data
 * @param dataType - The data type for fingerprinting
 * @returns Fingerprint string
 */
export function buildFingerprint(
  mappedData: Record<string, any>,
  dataType: MigrationDataType,
): string {
  const rule = DUPLICATE_RULES[dataType];
  return rule.fields
    .map((f) => {
      const value = mappedData[f];
      // Normalize for fingerprinting: trim, lowercase, collapse whitespace
      if (value === null || value === undefined) {
        return "";
      }
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    })
    .join("|");
}

/**
 * Extract unique fingerprints from validated rows.
 *
 * @param rows - Validated rows from a sheet
 * @param dataType - The data type
 * @returns Map of fingerprint → row indices that have this fingerprint
 */
export function extractFingerprints(
  rows: RowValidation[],
  dataType: MigrationDataType,
): Map<string, number[]> {
  const fingerprintMap = new Map<string, number[]>();

  for (const row of rows) {
    // Only check valid and warning rows (errors won't be imported)
    if (row.status === "error") {
      continue;
    }

    const fingerprint = buildFingerprint(row.mappedData, dataType);
    const existing = fingerprintMap.get(fingerprint) || [];
    existing.push(row.rowIndex);
    fingerprintMap.set(fingerprint, existing);
  }

  return fingerprintMap;
}

// ── Database Querying ───────────────────────────────────────────────────

/**
 * Get the database table name for a data type.
 */
function getTableName(dataType: MigrationDataType): string {
  const tables: Record<MigrationDataType, string> = {
    flocks: "flocks",
    egg_production: "egg_production",
    feed_consumption: "feed_records",
    feed_purchases: "feed_inventory",
    health: "health",
    mortality: "mortality",
    sales: "sales",
    expenses: "expenses",
  };
  return tables[dataType];
}

/**
 * Get the fields to select from the database for duplicate identification.
 * Data minimisation: only return fields needed for UI display.
 */
function getSelectFields(dataType: MigrationDataType): string {
  // Return minimal fields needed to identify and display the record
  switch (dataType) {
    case "flocks":
      return "id, flock_name, bird_type, quantity";
    case "egg_production":
      return "id, production_date, flock_id, egg_count";
    case "feed_consumption":
      return "id, feed_date, flock_id, feed_type, quantity_kg";
    case "feed_purchases":
      return "id, purchase_date, feed_type, quantity_kg, cost";
    case "health":
      return "id, health_date, flock_id, treatment_name, category";
    case "mortality":
      return "id, mortality_date, flock_id, reason, quantity";
    case "sales":
      return "id, sale_date, item_type, quantity, unit_price, total_amount";
    case "expenses":
      return "id, expense_date, category, amount";
    default:
      return "id";
  }
}

/**
 * Build a Supabase query to find existing duplicates for a data type.
 *
 * @param dataType - The data type to check
 * @param fingerprints - Array of fingerprints to check
 * @param authorisedFarmId - The farm ID (server-derived, never from client)
 * @returns Promise resolving to Map of fingerprint → existing record info
 */
export async function checkExistingDuplicates(
  dataType: MigrationDataType,
  fingerprints: string[],
  authorisedFarmId: string,
): Promise<Map<string, ExistingDuplicate>> {
  const duplicates = new Map<string, ExistingDuplicate>();

  if (fingerprints.length === 0) {
    return duplicates;
  }

  const tableName = getTableName(dataType);
  const selectFields = getSelectFields(dataType);

  // For data types with flock_id, we need to join or handle differently
  // Since we're using fingerprints that include normalized flock names,
  // we need to query with flock information

  if (dataType === "flocks") {
    // Flocks: fingerprint is just flock_name (normalized)
    // Query: WHERE farm_id = ? AND LOWER(TRIM(flock_name)) IN (...)
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select(selectFields)
      .eq("farm_id", authorisedFarmId)
      .or(`flock_name.in.(${fingerprints.map(f => `"${f}"`).join(",")})`);

    if (error || !data) {
      return duplicates;
    }

    // Map flock_name (normalized) → record info
    for (const record of data as any[]) {
      const normalizedName = String(record.flock_name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      duplicates.set(normalizedName, {
        fingerprint: normalizedName,
        existingRecordId: record.id,
        rowIndex: 0, // Will be set by caller
        existingRecord: record,
      } as ExistingDuplicate);
    }
  } else {
    // Operational data: fingerprint includes date + flock info + other fields
    // We need to query with flock name resolution
    // Strategy: Get all flocks for this farm, then query operational records

    // Step 1: Get farm flocks
    const { data: flocks, error: flockError } = await supabaseAdmin
      .from("flocks")
      .select("id, flock_name")
      .eq("farm_id", authorisedFarmId);

    if (flockError || !flocks || flocks.length === 0) {
      // If no flocks exist yet, no duplicates possible
      return duplicates;
    }

    // Build flock name → id map (normalized)
    const flockNameToId = new Map<string, string>();
    for (const flock of flocks) {
      const normalizedName = String(flock.flock_name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      flockNameToId.set(normalizedName, flock.id);
    }

    // Step 2: Parse fingerprints to extract flock names
    // Fingerprint format: "date|flock_name|other_fields..."
    const rule = DUPLICATE_RULES[dataType];
    const flockFieldIndex = rule.fields.indexOf("flock_name");

    // Group fingerprints by flock_id
    const fingerprintsByFlock = new Map<string, string[]>();
    
    for (const fingerprint of fingerprints) {
      const parts = fingerprint.split("|");
      if (flockFieldIndex >= 0 && flockFieldIndex < parts.length) {
        const flockName = parts[flockFieldIndex];
        const flockId = flockNameToId.get(flockName);
        
        if (flockId) {
          const existing = fingerprintsByFlock.get(flockId) || [];
          existing.push(fingerprint);
          fingerprintsByFlock.set(flockId, existing);
        }
      }
    }

    // Step 3: Query operational records by flock_id and fingerprint fields
    // We need to build queries for each flock
    for (const [flockId, flockFingerprints] of fingerprintsByFlock) {
      // Build OR conditions for the fingerprint fields
      // For egg_production: production_date = ?
      // For feed_consumption: feed_date = ? AND feed_type = ?
      // etc.
      
      const conditions = flockFingerprints.map((fp) => {
        const parts = fp.split("|");
        const conditions: string[] = [];
        
        for (let i = 0; i < rule.fields.length; i++) {
          const field = rule.fields[i];
          const value = parts[i] || "";
          
          // Skip flock_name field as it's already filtered by flock_id
          if (field === "flock_name") continue;
          
          // Map field names to database columns
          const dbField = mapFieldToDbColumn(field, dataType);
          conditions.push(`${dbField}=${value ? `"${value}"` : "null"}`);
        }
        
        return conditions.join(" AND ");
      });

      if (conditions.length === 0) {
        continue;
      }

      const orClause = conditions.join(" OR ");
      
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(selectFields)
        .eq("farm_id", authorisedFarmId)
        .eq("flock_id", flockId)
        .or(orClause);

      if (error || !data) {
        continue;
      }

      // Map fingerprints to records
      for (const record of data as any[]) {
        const recordFingerprint = buildFingerprintFromRecord(record, dataType);
        if (flockFingerprints.includes(recordFingerprint)) {
          duplicates.set(recordFingerprint, {
            fingerprint: recordFingerprint,
            existingRecordId: record.id,
            rowIndex: 0, // Will be set by caller
            existingRecord: record,
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Map a PoultryOps field name to a database column name.
 */
function mapFieldToDbColumn(field: string, dataType: MigrationDataType): string {
  // Most fields map directly, but some have different names
  const fieldMap: Record<string, Record<string, string>> = {
    egg_production: {
      production_date: "production_date",
      flock_name: "flock_id", // This is handled separately
      egg_count: "egg_count",
      cracked_eggs: "cracked_eggs",
    },
    feed_consumption: {
      feed_date: "feed_date",
      flock_name: "flock_id",
      feed_type: "feed_type",
      quantity_kg: "quantity_kg",
    },
    feed_purchases: {
      purchase_date: "purchase_date",
      feed_type: "feed_type",
      quantity_kg: "quantity_kg",
      cost: "cost",
      supplier: "supplier",
    },
    health: {
      health_date: "health_date",
      flock_name: "flock_id",
      treatment_name: "treatment_name",
      category: "category",
      cost: "cost",
      notes: "notes",
      isolated_birds: "isolated_birds",
    },
    mortality: {
      mortality_date: "mortality_date",
      flock_name: "flock_id",
      reason: "reason",
      quantity: "quantity",
    },
    sales: {
      sale_date: "sale_date",
      item_type: "item_type",
      quantity: "quantity",
      unit_price: "unit_price",
      total_amount: "total_amount",
      notes: "notes",
    },
    expenses: {
      expense_date: "expense_date",
      category: "category",
      amount: "amount",
      notes: "notes",
    },
  };

  return fieldMap[dataType]?.[field] || field;
}

/**
 * Build a fingerprint from an existing database record.
 */
function buildFingerprintFromRecord(
  record: Record<string, any>,
  dataType: MigrationDataType,
): string {
  const rule = DUPLICATE_RULES[dataType];
  
  return rule.fields
    .map((f) => {
      const dbField = mapFieldToDbColumn(f, dataType);
      const value = record[dbField];
      
      if (value === null || value === undefined) {
        return "";
      }
      
      // For dates, normalize to YYYY-MM-DD
      if (f.endsWith("_date") && value) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }
      
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    })
    .join("|");
}

// ── Batch Processing ────────────────────────────────────────────────────

/**
 * Check existing duplicates for all sheets in a validation result.
 *
 * Processes fingerprints in batches to avoid SQL query length limits.
 *
 * @param validationResult - The validation result from validateWorkbook
 * @param authorisedFarmId - The farm ID (server-derived)
 * @returns Updated validation result with existing duplicate information
 */
export async function checkAllExistingDuplicates(
  validationResult: SheetValidationResult[],
  authorisedFarmId: string,
): Promise<SheetValidationResult[]> {
  const BATCH_SIZE = 500; // fingerprints per query

  const updatedResults: SheetValidationResult[] = [];

  for (const sheetResult of validationResult) {
    const { dataType, rows } = sheetResult;

    // Extract fingerprints from valid/warning rows
    const fingerprintMap = extractFingerprints(rows, dataType);
    const fingerprints = Array.from(fingerprintMap.keys());

    if (fingerprints.length === 0) {
      updatedResults.push(sheetResult);
      continue;
    }

    // Process in batches
    const allDuplicates = new Map<string, ExistingDuplicate>();

    for (let i = 0; i < fingerprints.length; i += BATCH_SIZE) {
      const batch = fingerprints.slice(i, i + BATCH_SIZE);
      const batchDuplicates = await checkExistingDuplicates(
        dataType,
        batch,
        authorisedFarmId,
      );

      // Merge results
      for (const [fingerprint, duplicate] of batchDuplicates) {
        allDuplicates.set(fingerprint, duplicate);
      }
    }

    // Update rows with existing duplicate information
    const updatedRows = rows.map((row) => {
      if (row.status === "error") {
        return row; // Don't modify error rows
      }

      const fingerprint = buildFingerprint(row.mappedData, dataType);
      const existingDuplicate = allDuplicates.get(fingerprint);

      if (existingDuplicate) {
        return {
          ...row,
          isExistingDuplicate: true,
          existingDuplicateRecordId: existingDuplicate.existingRecordId,
          existingDuplicateRecord: existingDuplicate.existingRecord,
        } as any;
      }

      return row;
    });

    // Recalculate counts
    let existingDuplicateCount = 0;
    for (const row of updatedRows) {
      if ((row as any).isExistingDuplicate) {
        existingDuplicateCount++;
      }
    }

    updatedResults.push({
      ...sheetResult,
      rows: updatedRows,
      existingDuplicateRows: existingDuplicateCount,
    } as any);
  }

  return updatedResults;
}

// ── Re-exports ──────────────────────────────────────────────────────────

export { DUPLICATE_RULES } from "./validator";
export type { DuplicateRule } from "./types";