/**
 * PoultryOps Migration — Importer (Batch Insert Service)
 *
 * Phase B: Batch import service that inserts validated records into
 * the database using supabaseAdmin.
 *
 * Key design decisions:
 * - Batch inserts in groups of 100 (configurable)
 * - Stops the affected import target if a batch fails
 * - Never uses timestamp-based rollback
 * - Never silently overwrites existing records
 * - All writes use authorisedFarmId (server-derived, never client-supplied)
 * - Flocks are processed before operational data
 * - Fixes the existing expenses farm_id:null bug
 *
 * This module keeps batch-import logic isolated in lib/migration/
 * and does NOT modify existing operational CRUD libraries.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import type {
  MigrationDataType,
  RowValidation,
  SheetValidationResult,
} from "./types";

// ── Data Type → Database Table Mapping ──────────────────────────────────

const DATA_TYPE_TABLES: Record<MigrationDataType, string> = {
  flocks: "flocks",
  egg_production: "egg_production",
  feed_consumption: "feed_records",
  feed_purchases: "feed_inventory",
  health: "health",
  mortality: "mortality",
  sales: "sales",
  expenses: "expenses",
};

// ── Import Order (flocks must be processed first) ───────────────────────

const IMPORT_ORDER: MigrationDataType[] = [
  "flocks",
  "egg_production",
  "feed_consumption",
  "feed_purchases",
  "health",
  "mortality",
  "sales",
  "expenses",
];

// ── Types ───────────────────────────────────────────────────────────────

export interface ImportTarget {
  sheetName: string;
  dataType: MigrationDataType;
  rows: RowValidation[];
}

export interface ImportResult {
  sheetName: string;
  dataType: MigrationDataType;
  totalRows: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ImportOptions {
  /** Batch size for inserts (default: 100) */
  batchSize: number;
  /** Skip potential duplicates (default: true) */
  skipDuplicates: boolean;
  /** Default flock ID for sheets without flock_name column */
  defaultFlockId?: string;
}

export interface ImportSummary {
  targets: ImportResult[];
  totalInserted: number;
  totalSkipped: number;
  totalFailed: number;
  flockMap: Record<string, string>;
}

// ── Flock Creation ───────────────────────────────────────────────────────

/**
 * Create flocks from validated rows.
 *
 * Only processes rows with status "valid" or "warning".
 * Error rows are skipped.
 *
 * @param rows - Validated rows from the Flocks sheet
 * @param authorisedFarmId - Server-derived farm ID
 * @param options - Import options
 * @returns ImportResult for the flocks target
 */
export async function importFlocks(
  rows: RowValidation[],
  authorisedFarmId: string,
  options: ImportOptions,
): Promise<ImportResult> {
  const processable = rows.filter((r) => r.status !== "error");
  const toImport = options.skipDuplicates
    ? processable.filter((r) => !r.isDuplicate)
    : processable;

  const skipped = rows.length - toImport.length;
  let inserted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < toImport.length; i += options.batchSize) {
    const batch = toImport.slice(i, i + options.batchSize);
    const records = batch.map((r) => ({
      farm_id: authorisedFarmId,
      flock_name: r.mappedData.flock_name,
      bird_type: r.mappedData.bird_type,
      quantity: r.mappedData.quantity,
    }));

    const { error } = await supabaseAdmin
      .from("flocks")
      .insert(records);

    if (error) {
      failed += batch.length;
      errors.push(`Batch ${Math.floor(i / options.batchSize) + 1}: ${error.message}`);
      break; // Stop processing this target
    }

    inserted += batch.length;
  }

  return {
    sheetName: "Flocks",
    dataType: "flocks",
    totalRows: rows.length,
    inserted,
    skipped,
    failed,
    errors,
  };
}

// ── Operational Data Import ──────────────────────────────────────────────

/**
 * Import operational data (egg production, feed, health, etc.).
 *
 * Only processes rows with status "valid" or "warning".
 * Error rows are skipped.
 * Duplicates are skipped if skipDuplicates is true.
 *
 * All records are inserted with farm_id = authorisedFarmId.
 * Flock references are resolved via flockMap.
 *
 * For Sales records, total_amount is calculated from quantity * unit_price
 * when not provided or invalid.
 *
 * @param target - Import target (sheet name, data type, validated rows)
 * @param authorisedFarmId - Server-derived farm ID
 * @param flockMap - Map of flock_name → flock_id
 * @param options - Import options
 * @returns ImportResult
 */
export async function importOperationalData(
  target: ImportTarget,
  authorisedFarmId: string,
  flockMap: Record<string, string>,
  options: ImportOptions,
): Promise<ImportResult> {
  const { sheetName, dataType, rows } = target;
  const tableName = DATA_TYPE_TABLES[dataType];

  const processable = rows.filter((r) => r.status !== "error");
  const toImport = options.skipDuplicates
    ? processable.filter((r) => !r.isDuplicate)
    : processable;

  const skipped = rows.length - toImport.length;
  let inserted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < toImport.length; i += options.batchSize) {
    const batch = toImport.slice(i, i + options.batchSize);
    const records = batch.map((r) => {
      const record: Record<string, any> = { ...r.mappedData };

      // Always set farm_id server-side (fixes the expenses farm_id:null bug)
      record.farm_id = authorisedFarmId;

      // Resolve flock_id from flockMap if flock_name is present
      if (record.flock_name && flockMap[record.flock_name]) {
        record.flock_id = flockMap[record.flock_name];
      } else if (options.defaultFlockId) {
        record.flock_id = options.defaultFlockId;
      }

      // Remove non-DB fields (flock_name is not a DB column for operational tables)
      delete record.flock_name;

      // Calculate total_amount for sales if not provided or invalid
      if (dataType === "sales") {
        const quantity = Number(record.quantity);
        const unitPrice = Number(record.unit_price);
        const totalAmount = Number(record.total_amount);

        // Use provided valid total_amount, or calculate from quantity * unit_price
        if (isNaN(totalAmount)) {
          if (!isNaN(quantity) && !isNaN(unitPrice)) {
            record.total_amount = quantity * unitPrice;
          }
        }
      }

      return record;
    });

    const { error } = await supabaseAdmin
      .from(tableName)
      .insert(records);

    if (error) {
      failed += batch.length;
      errors.push(
        `Batch ${Math.floor(i / options.batchSize) + 1}: ${error.message}`,
      );
      break; // Stop processing this target
    }

    inserted += batch.length;
  }

  return {
    sheetName,
    dataType,
    totalRows: rows.length,
    inserted,
    skipped,
    failed,
    errors,
  };
}

// ── Full Import Pipeline ─────────────────────────────────────────────────

/**
 * Execute the full import pipeline.
 *
 * 1. Process flocks first (creates new flocks)
 * 2. Build flock map from created + existing flocks
 * 3. Process operational data in order
 * 4. Return summary with per-target results
 *
 * @param targets - Array of import targets
 * @param authorisedFarmId - Server-derived farm ID
 * @param existingFlockMap - Pre-existing flock map (from the authorised farm)
 * @param options - Import options
 * @returns ImportSummary
 */
export async function executeImport(
  targets: ImportTarget[],
  authorisedFarmId: string,
  existingFlockMap: Record<string, string>,
  options: ImportOptions,
): Promise<ImportSummary> {
  const results: ImportResult[] = [];
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Build flock map starting with existing flocks
  const flockMap: Record<string, string> = { ...existingFlockMap };

  // Process targets in order (flocks first)
  const sortedTargets = [...targets].sort((a, b) => {
    const aIdx = IMPORT_ORDER.indexOf(a.dataType);
    const bIdx = IMPORT_ORDER.indexOf(b.dataType);
    return aIdx - bIdx;
  });

  for (const target of sortedTargets) {
    let result: ImportResult;

    if (target.dataType === "flocks") {
      // Create new flocks
      result = await importFlocks(
        target.rows,
        authorisedFarmId,
        options,
      );

      // Update flock map with newly created flocks
      // We need to re-query to get the IDs
      const { data: newFlocks } = await supabaseAdmin
        .from("flocks")
        .select("id, flock_name")
        .eq("farm_id", authorisedFarmId);

      if (newFlocks) {
        for (const f of newFlocks) {
          flockMap[f.flock_name] = f.id;
        }
      }
    } else {
      // Import operational data
      result = await importOperationalData(
        target,
        authorisedFarmId,
        flockMap,
        options,
      );
    }

    results.push(result);
    totalInserted += result.inserted;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  return {
    targets: results,
    totalInserted,
    totalSkipped,
    totalFailed,
    flockMap,
  };
}
