/**
 * PoultryOps Migration — Importer (Batch Insert Service)
 *
 * Secure batch import service.
 *
 * Key design decisions:
 * - Batch inserts in groups of 100 (configurable)
 * - Stops the affected import target if a batch fails
 * - Never uses timestamp-based rollback
 * - Never silently overwrites existing records
 * - All writes use authorisedFarmId
 * - Flocks are processed before operational data
 * - Newly created flock IDs are reloaded from the database
 * - Flock-name matching is normalised consistently
 * - Blank spreadsheet values are converted to null before database insert
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import type {
  MigrationDataType,
  RowValidation,
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

// ── Import Order ────────────────────────────────────────────────────────

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
  batchSize: number;
  skipDuplicates: boolean;
  defaultFlockId?: string;
}

export interface ImportSummary {
  targets: ImportResult[];
  totalInserted: number;
  totalSkipped: number;
  totalFailed: number;
  flockMap: Record<string, string>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function normalizeFlockName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Convert blank spreadsheet strings to null.
 *
 * PostgreSQL numeric, integer, date and other typed columns cannot accept
 * an empty string (""). Optional blank spreadsheet cells should therefore
 * be represented as null before insertion.
 */
function convertBlankStringsToNull(
  record: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(record)) {
    const value = record[key];

    if (
      typeof value === "string" &&
      value.trim() === ""
    ) {
      record[key] = null;
    }
  }

  return record;
}

/**
 * Reload the authoritative flock map directly from the database.
 *
 * This deliberately replaces any pending:* placeholders created during
 * workbook validation with real database UUIDs.
 */
async function loadFarmFlockMap(
  authorisedFarmId: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from("flocks")
    .select("id, flock_name")
    .eq("farm_id", authorisedFarmId);

  if (error) {
    throw new Error(
      `Unable to reload farm flocks after import: ${error.message}`,
    );
  }

  const map: Record<string, string> = {};

  for (const flock of data ?? []) {
    const key = normalizeFlockName(flock.flock_name);

    if (key) {
      map[key] = flock.id;
    }
  }

  return map;
}

// ── Flock Creation ──────────────────────────────────────────────────────

export async function importFlocks(
  rows: RowValidation[],
  authorisedFarmId: string,
  options: ImportOptions,
): Promise<ImportResult> {
  const processable = rows.filter(
    (r) => r.status !== "error",
  );

  const toImport = options.skipDuplicates
    ? processable.filter(
        (r) =>
          !r.isDuplicate &&
          !r.isExistingDuplicate,
      )
    : processable;

  const skipped = rows.length - toImport.length;

  let inserted = 0;
  let failed = 0;

  const errors: string[] = [];

  for (
    let i = 0;
    i < toImport.length;
    i += options.batchSize
  ) {
    const batch = toImport.slice(
      i,
      i + options.batchSize,
    );

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

      errors.push(
        `Batch ${
          Math.floor(i / options.batchSize) + 1
        }: ${error.message}`,
      );

      break;
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

// ── Operational Data Import ─────────────────────────────────────────────

export async function importOperationalData(
  target: ImportTarget,
  authorisedFarmId: string,
  flockMap: Record<string, string>,
  options: ImportOptions,
): Promise<ImportResult> {
  const {
    sheetName,
    dataType,
    rows,
  } = target;

  const tableName =
    DATA_TYPE_TABLES[dataType];

  const processable = rows.filter(
    (r) => r.status !== "error",
  );

  const toImport = options.skipDuplicates
    ? processable.filter(
        (r) =>
          !r.isDuplicate &&
          !r.isExistingDuplicate,
      )
    : processable;

  const skipped =
    rows.length - toImport.length;

  let inserted = 0;
  let failed = 0;

  const errors: string[] = [];

  for (
    let i = 0;
    i < toImport.length;
    i += options.batchSize
  ) {
    const batch = toImport.slice(
      i,
      i + options.batchSize,
    );

    const records = batch.map((r) => {
      const record: Record<string, any> = {
        ...r.mappedData,
      };

      // Farm ownership is ALWAYS established server-side.
      record.farm_id = authorisedFarmId;

      // Resolve flock_name using the same normalisation used everywhere
      // else in the migration system.
      if (record.flock_name) {
        const normalizedFlockName =
          normalizeFlockName(
            record.flock_name,
          );

        const resolvedFlockId =
          flockMap[normalizedFlockName];

        if (resolvedFlockId) {
          record.flock_id =
            resolvedFlockId;
        } else if (
          options.defaultFlockId
        ) {
          record.flock_id =
            options.defaultFlockId;
        }
      } else if (
        options.defaultFlockId
      ) {
        record.flock_id =
          options.defaultFlockId;
      }

      // flock_name is a migration helper field,
      // not an operational database column.
      delete record.flock_name;

      /**
       * IMPORTANT:
       *
       * Blank spreadsheet cells can arrive as "".
       * PostgreSQL numeric/integer/date columns reject "".
       *
       * Convert blank strings to null before performing
       * any data-type-specific calculations.
       */
      convertBlankStringsToNull(record);

      /**
       * Sales:
       *
       * total_amount is required by the database.
       * If it was blank in the spreadsheet, calculate it
       * from quantity × unit_price.
       */
      if (dataType === "sales") {
        const quantity =
          Number(record.quantity);

        const unitPrice =
          Number(record.unit_price);

        const totalAmountMissing =
          record.total_amount === null ||
          record.total_amount === undefined;

        if (totalAmountMissing) {
          if (
            Number.isFinite(quantity) &&
            Number.isFinite(unitPrice)
          ) {
            record.total_amount =
              quantity * unitPrice;
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
        `Batch ${
          Math.floor(i / options.batchSize) + 1
        }: ${error.message}`,
      );

      break;
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

// ── Full Import Pipeline ────────────────────────────────────────────────

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

  /**
   * Start with the existing map, but normalise all
   * keys and discard pending placeholders.
   */
  let flockMap: Record<string, string> = {};

  for (
    const [name, id]
    of Object.entries(existingFlockMap)
  ) {
    if (
      !id ||
      id.startsWith("pending:")
    ) {
      continue;
    }

    const normalizedName =
      normalizeFlockName(name);

    if (normalizedName) {
      flockMap[normalizedName] = id;
    }
  }

  // Flocks MUST execute before dependent operational records.
  const sortedTargets =
    [...targets].sort((a, b) => {
      const aIdx =
        IMPORT_ORDER.indexOf(a.dataType);

      const bIdx =
        IMPORT_ORDER.indexOf(b.dataType);

      return aIdx - bIdx;
    });

  for (const target of sortedTargets) {
    let result: ImportResult;

    if (target.dataType === "flocks") {
      result = await importFlocks(
        target.rows,
        authorisedFarmId,
        options,
      );

      /**
       * Once flock creation has completed,
       * discard the temporary workbook map
       * and reload authoritative UUIDs
       * directly from PostgreSQL.
       */
      flockMap =
        await loadFarmFlockMap(
          authorisedFarmId,
        );
    } else {
      result =
        await importOperationalData(
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