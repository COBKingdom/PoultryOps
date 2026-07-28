/**
 * PoultryOps Migration — Legacy Spreadsheet Adapter
 *
 * Converts recognised legacy / existing poultry-farm spreadsheets into
 * PoultryOps migration validation results.
 *
 * Initial compatibility profile:
 * - SHOBAL-style daily poultry spreadsheets
 *
 * Design principles:
 * - Does NOT modify the standard PoultryOps migration workbook behaviour.
 * - Does NOT write to the database.
 * - Infers flock context from legacy worksheet names.
 * - Creates normal PoultryOps SheetValidationResult objects so the existing
 *   Review → Confirm → Import pipeline can be reused.
 * - Ignores unsupported non-poultry sheets such as Ruminants.
 */

import * as XLSX from "xlsx";

import type {
  ColumnMapping,
  MigrationDataType,
  RowValidation,
  SheetValidationResult,
  ValidationResult,
} from "./types";

import { parseDate } from "./validator";

// ── Types ───────────────────────────────────────────────────────────────

interface LegacySheetProfile {
  sheetName: string;
  flockName: string;
  birdType: string;
  feedType: string;
}

interface LegacyRecord {
  sourceRow: number;
  data: Record<string, any>;
}

// ── Header Helpers ──────────────────────────────────────────────────────

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFlockName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findHeader(
  row: Record<string, any>,
  aliases: string[],
): string | undefined {
  const normalizedAliases = aliases.map(normalizeHeader);

  return Object.keys(row).find((key) =>
    normalizedAliases.includes(normalizeHeader(key)),
  );
}

function getValue(
  row: Record<string, any>,
  aliases: string[],
): unknown {
  const key = findHeader(row, aliases);
  return key ? row[key] : undefined;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim() !== "";
}

// ── Legacy Sheet Recognition ────────────────────────────────────────────

/**
 * Determine whether a worksheet looks like a legacy poultry daily-record
 * sheet rather than a standard PoultryOps migration sheet.
 */
function isLegacyPoultrySheet(
  sheetName: string,
  rows: Record<string, any>[],
): boolean {
  const normalizedSheetName = normalizeHeader(sheetName);

  // Explicitly ignore currently unsupported livestock sheets.
  if (
    normalizedSheetName.includes("ruminant") ||
    normalizedSheetName.includes("sheep") ||
    normalizedSheetName.includes("goat")
  ) {
    return false;
  }

  if (rows.length === 0) {
    return false;
  }

  const headers = Object.keys(rows[0]).map(normalizeHeader);

  const hasDate = headers.includes("date");

  const legacySignals = [
    "total egg production",
    "hen day egg production",
    "feed used",
    "feed used per kg",
    "feed bought",
    "feed bought per bag",
    "feed remaining",
    "mortality",
    "medication",
    "medication administered",
    "medication price",
    "bird sold",
    "egg sold",
    "number of birds",
    "number of isolated",
    "number of isolated birds",
    "remarkcomment",
  ];

  const signalCount = legacySignals.filter((signal) =>
    headers.includes(signal),
  ).length;

  return hasDate && signalCount >= 2;
}

/**
 * Infer PoultryOps flock context from a legacy worksheet.
 *
 * We deliberately keep different worksheets as different flocks/batches.
 * This avoids accidentally merging historical and current flocks.
 */
function getLegacySheetProfile(
  sheetName: string,
): LegacySheetProfile {
  const normalized = normalizeHeader(sheetName);

  let birdType = "Growers";
  let feedType = "Other";

  if (normalized.includes("layer")) {
    birdType = "Layers";
    feedType = "Layer Mash";
  } else if (normalized.includes("broiler")) {
    birdType = "Broilers";
    feedType = "Broiler Finisher";
  } else if (
    normalized.includes("noiler") ||
    normalized.includes("noilers")
  ) {
    // PoultryOps currently has no dedicated Noiler enum.
    // Growers is the safest supported classification for migration.
    birdType = "Growers";
    feedType = "Grower Feed";
  } else if (normalized.includes("cockerel")) {
    birdType = "Cockerels";
    feedType = "Grower Feed";
  }

  // Preserve a readable worksheet-derived flock name.
  const flockName = String(sheetName)
    .trim()
    .replace(/\s+/g, " ");

  return {
    sheetName,
    flockName,
    birdType,
    feedType,
  };
}

// ── Legacy Numeric Parsing ──────────────────────────────────────────────

function parseLegacyNumber(value: unknown): number | null {
  if (!hasValue(value)) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = String(value)
    .trim()
    .replace(/,/g, "");

  const match = text.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseLegacyInteger(value: unknown): number | null {
  const number = parseLegacyNumber(value);

  if (number === null) {
    return null;
  }

  return Math.round(number);
}

/**
 * Convert legacy feed quantities to kilograms where possible.
 *
 * Examples:
 *   21kg          → 21
 *   22.5KG        → 22.5
 *   5 bags        → 125   (assuming 25kg legacy bag)
 *   4 bags, 4kg   → 104
 *
 * IMPORTANT:
 * Legacy spreadsheets do not always state bag weight. We use 25kg only
 * where the source explicitly uses "bag(s)" and no better information
 * exists. Such conversions are returned with a warning.
 */
function parseLegacyFeedQuantity(value: unknown): {
  value: number | null;
  warning?: string;
} {
  if (!hasValue(value)) {
    return { value: null };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { value };
  }

  const text = String(value)
    .trim()
    .toLowerCase()
    .replace(/,/g, " ");

  let totalKg = 0;
  let found = false;
  let usedBagAssumption = false;

  const bagMatch = text.match(
    /(\d+(?:\.\d+)?)\s*bags?/i,
  );

  if (bagMatch) {
    const bags = Number(bagMatch[1]);

    if (Number.isFinite(bags)) {
      totalKg += bags * 25;
      found = true;
      usedBagAssumption = true;
    }
  }

  const kgMatch = text.match(
    /(\d+(?:\.\d+)?)\s*kg/i,
  );

  if (kgMatch) {
    const kg = Number(kgMatch[1]);

    if (Number.isFinite(kg)) {
      totalKg += kg;
      found = true;
    }
  }

  if (!found) {
    const plain = parseLegacyNumber(text);

    if (plain !== null) {
      return { value: plain };
    }

    return { value: null };
  }

  return {
    value: totalKg,
    warning: usedBagAssumption
      ? `Feed quantity "${value}" included bag quantities. PoultryOps interpreted each legacy bag as 25kg; verify this value before import.`
      : undefined,
  };
}

// ── Mapping Helpers ─────────────────────────────────────────────────────

function makeMapping(
  sourceColumn: string,
  poultryOpsField: string,
  dataType: MigrationDataType,
): ColumnMapping {
  return {
    sourceColumn,
    poultryOpsField,
    dataType,
    confidence: "auto",
  };
}

function makeRow(
  sourceRow: number,
  mappedData: Record<string, any>,
  warnings: string[] = [],
  errors: string[] = [],
): RowValidation {
  let status: RowValidation["status"] = "valid";

  if (errors.length > 0) {
    status = "error";
  } else if (warnings.length > 0) {
    status = "warning";
  }

  return {
    rowIndex: sourceRow,
    status,
    errors,
    warnings,
    mappedData,
    isDuplicate: false,
  };
}

function buildSheetResult(
  sheetName: string,
  dataType: MigrationDataType,
  rows: RowValidation[],
  columnMappings: ColumnMapping[],
): SheetValidationResult {
  return {
    sheetName,
    dataType,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.status === "valid").length,
    warningRows: rows.filter((row) => row.status === "warning").length,
    errorRows: rows.filter((row) => row.status === "error").length,
    duplicateRows: rows.filter((row) => row.isDuplicate).length,
    existingDuplicateRows: 0,
    rows,
    columnMappings,
  };
}

// ── Flock Extraction ────────────────────────────────────────────────────

function buildLegacyFlockResult(
  profile: LegacySheetProfile,
  sourceRows: Record<string, any>[],
): SheetValidationResult {
  let quantity = 0;

  // Prefer the earliest usable bird-count value.
  for (const row of sourceRows) {
    const rawQuantity = getValue(row, [
      "number of birds",
      "no of birds",
      "bird count",
      "quantity",
    ]);

    const parsed = parseLegacyInteger(rawQuantity);

    if (parsed !== null && parsed >= 0) {
      quantity = parsed;
      break;
    }
  }

  const warnings: string[] = [];

  if (quantity === 0) {
    warnings.push(
      "Initial flock quantity could not be determined from the legacy worksheet. Quantity has been set to 0 and should be reviewed.",
    );
  }

  const row = makeRow(
    2,
    {
      flock_name: profile.flockName,
      bird_type: profile.birdType,
      quantity,
    },
    warnings,
  );

  return buildSheetResult(
    `${profile.sheetName} — Flock`,
    "flocks",
    [row],
    [
      makeMapping(
        "Worksheet Name",
        "flock_name",
        "flocks",
      ),
      makeMapping(
        "Number of Birds",
        "quantity",
        "flocks",
      ),
    ],
  );
}

// ── Operational Extraction ──────────────────────────────────────────────

function extractLegacyOperationalRecords(
  profile: LegacySheetProfile,
  rows: Record<string, any>[],
): SheetValidationResult[] {
  const eggRows: RowValidation[] = [];
  const feedRows: RowValidation[] = [];
  const feedPurchaseRows: RowValidation[] = [];
  const healthRows: RowValidation[] = [];
  const mortalityRows: RowValidation[] = [];
  const salesRows: RowValidation[] = [];

  rows.forEach((row, index) => {
    const sourceRow = index + 2;

    const rawDate = getValue(row, [
      "date",
      "record date",
    ]);

    if (!hasValue(rawDate)) {
      return;
    }

    const parsedDate = parseDate(rawDate);

    if (!parsedDate) {
      return;
    }

    const notes = getValue(row, [
      "remark/comment",
      "remark",
      "comment",
      "remarks",
      "notes",
    ]);

    // ── Egg Production ───────────────────────────────────────────────

    const rawEggProduction = getValue(row, [
      "total egg production",
      "egg production",
      "hen-day egg production",
      "hen day egg production",
    ]);

    const eggCount = parseLegacyInteger(rawEggProduction);

    if (eggCount !== null && eggCount >= 0) {
      eggRows.push(
        makeRow(sourceRow, {
          production_date: parsedDate,
          flock_name: normalizeFlockName(profile.flockName),
          egg_count: eggCount,
          cracked_eggs: 0,
        }),
      );
    }

    // ── Feed Consumption ─────────────────────────────────────────────

    const rawFeedUsed = getValue(row, [
      "feed used",
      "feed used per kg",
      "feed consumption",
    ]);

    if (hasValue(rawFeedUsed)) {
      const parsedFeed = parseLegacyFeedQuantity(
        rawFeedUsed,
      );

      if (
        parsedFeed.value !== null &&
        parsedFeed.value >= 0
      ) {
        const warnings = parsedFeed.warning
          ? [parsedFeed.warning]
          : [];

        feedRows.push(
          makeRow(
            sourceRow,
            {
              feed_date: parsedDate,
              flock_name: normalizeFlockName(
                profile.flockName,
              ),
              feed_type: profile.feedType,
              quantity_kg: parsedFeed.value,
            },
            warnings,
          ),
        );
      }
    }

    // ── Feed Purchases ───────────────────────────────────────────────

    const rawFeedBought = getValue(row, [
      "feed bought",
      "feed bought per bag",
      "feed purchased",
    ]);

    if (hasValue(rawFeedBought)) {
      const parsedPurchase = parseLegacyFeedQuantity(
        rawFeedBought,
      );

      if (
        parsedPurchase.value !== null &&
        parsedPurchase.value > 0
      ) {
        const warnings = [
          "Legacy spreadsheet does not provide a reliable feed purchase cost. Cost has been set to 0.",
        ];

        if (parsedPurchase.warning) {
          warnings.push(parsedPurchase.warning);
        }

        feedPurchaseRows.push(
          makeRow(
            sourceRow,
            {
              purchase_date: parsedDate,
              feed_type:
                profile.birdType === "Layers"
                  ? "Layer Mash"
                  : profile.birdType === "Broilers"
                    ? "Finisher"
                    : "Grower",
              quantity_kg: parsedPurchase.value,
              cost: 0,
              supplier: "",
            },
            warnings,
          ),
        );
      }
    }

    // ── Mortality ────────────────────────────────────────────────────

    const rawMortality = getValue(row, [
      "mortality",
      "birds died",
      "dead birds",
      "mortality count",
    ]);

    const mortalityQuantity =
      parseLegacyInteger(rawMortality);

    if (
      mortalityQuantity !== null &&
      mortalityQuantity > 0
    ) {
      mortalityRows.push(
        makeRow(sourceRow, {
          mortality_date: parsedDate,
          flock_name: normalizeFlockName(
            profile.flockName,
          ),
          quantity: mortalityQuantity,
          reason: "Unknown",
        }),
      );
    }

    // ── Health ───────────────────────────────────────────────────────

    const rawMedication = getValue(row, [
      "medication administered",
      "medication",
      "treatment",
      "medicine",
    ]);

    const rawMedicationPrice = getValue(row, [
      "medication price",
      "treatment cost",
      "cost",
    ]);

    const rawIsolated = getValue(row, [
      "number of isolated birds",
      "number of isolated",
      "isolated birds",
    ]);

    if (hasValue(rawMedication)) {
      const cost =
        parseLegacyNumber(rawMedicationPrice) ?? 0;

      const isolatedBirds =
        parseLegacyInteger(rawIsolated) ?? 0;

      healthRows.push(
        makeRow(sourceRow, {
          health_date: parsedDate,
          flock_name: normalizeFlockName(
            profile.flockName,
          ),
          treatment_name: String(rawMedication).trim(),
          category: "Treatment",
          cost,
          notes: hasValue(notes)
            ? String(notes).trim()
            : "",
          isolated_birds: isolatedBirds,
        }),
      );
    }

    // ── Egg Sales ────────────────────────────────────────────────────

    const rawEggSold = getValue(row, [
      "egg sold",
      "eggs sold",
    ]);

    const eggSold = parseLegacyNumber(rawEggSold);

    if (eggSold !== null && eggSold > 0) {
      salesRows.push(
        makeRow(
          sourceRow,
          {
            sale_date: parsedDate,
            item_type: "Egg Sales",
            quantity: eggSold,
            unit_price: 0,
            total_amount: 0,
            notes: hasValue(notes)
              ? String(notes).trim()
              : "",
          },
          [
            "Legacy spreadsheet does not provide a reliable egg unit price. Unit price and total amount have been set to 0.",
          ],
        ),
      );
    }

    // ── Bird Sales ───────────────────────────────────────────────────

    const rawBirdSold = getValue(row, [
      "bird sold",
      "birds sold",
    ]);

    const birdSold = parseLegacyNumber(rawBirdSold);

    if (birdSold !== null && birdSold > 0) {
      salesRows.push(
        makeRow(
          sourceRow,
          {
            sale_date: parsedDate,
            item_type:
              profile.birdType === "Broilers"
                ? "Broiler Sales"
                : profile.birdType === "Cockerels"
                  ? "Cockerel Sales"
                  : profile.birdType === "Layers"
                    ? "Spent Layer Sales"
                    : "Live Bird Sales",
            quantity: birdSold,
            unit_price: 0,
            total_amount: 0,
            notes: hasValue(notes)
              ? String(notes).trim()
              : "",
          },
          [
            "Legacy spreadsheet does not provide a reliable bird unit price. Unit price and total amount have been set to 0.",
          ],
        ),
      );
    }
  });

  const results: SheetValidationResult[] = [];

  if (eggRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Egg Production`,
        "egg_production",
        eggRows,
        [
          makeMapping(
            "Date",
            "production_date",
            "egg_production",
          ),
          makeMapping(
            "Worksheet Name",
            "flock_name",
            "egg_production",
          ),
          makeMapping(
            "Total Egg Production",
            "egg_count",
            "egg_production",
          ),
        ],
      ),
    );
  }

  if (feedRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Feed Consumption`,
        "feed_consumption",
        feedRows,
        [
          makeMapping(
            "Date",
            "feed_date",
            "feed_consumption",
          ),
          makeMapping(
            "Worksheet Name",
            "flock_name",
            "feed_consumption",
          ),
          makeMapping(
            "Feed Used",
            "quantity_kg",
            "feed_consumption",
          ),
        ],
      ),
    );
  }

  if (feedPurchaseRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Feed Purchases`,
        "feed_purchases",
        feedPurchaseRows,
        [
          makeMapping(
            "Date",
            "purchase_date",
            "feed_purchases",
          ),
          makeMapping(
            "Feed Bought",
            "quantity_kg",
            "feed_purchases",
          ),
        ],
      ),
    );
  }

  if (healthRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Health`,
        "health",
        healthRows,
        [
          makeMapping(
            "Date",
            "health_date",
            "health",
          ),
          makeMapping(
            "Worksheet Name",
            "flock_name",
            "health",
          ),
          makeMapping(
            "Medication",
            "treatment_name",
            "health",
          ),
          makeMapping(
            "Medication Price",
            "cost",
            "health",
          ),
        ],
      ),
    );
  }

  if (mortalityRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Mortality`,
        "mortality",
        mortalityRows,
        [
          makeMapping(
            "Date",
            "mortality_date",
            "mortality",
          ),
          makeMapping(
            "Worksheet Name",
            "flock_name",
            "mortality",
          ),
          makeMapping(
            "Mortality",
            "quantity",
            "mortality",
          ),
        ],
      ),
    );
  }

  if (salesRows.length > 0) {
    results.push(
      buildSheetResult(
        `${profile.sheetName} — Sales`,
        "sales",
        salesRows,
        [
          makeMapping(
            "Date",
            "sale_date",
            "sales",
          ),
          makeMapping(
            "Bird Sold / Egg Sold",
            "quantity",
            "sales",
          ),
        ],
      ),
    );
  }

  return results;
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Determine whether the workbook contains at least one recognised
 * legacy poultry worksheet.
 */
export function isLegacyWorkbook(
  data: ArrayBuffer | Buffer,
): boolean {
  const workbook = XLSX.read(data, {
    cellDates: false,
    cellNF: false,
    cellText: false,
  });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: "",
        raw: false,
      },
    ) as Record<string, any>[];

    if (isLegacyPoultrySheet(sheetName, rows)) {
      return true;
    }
  }

  return false;
}

/**
 * Parse and transform a recognised legacy poultry workbook.
 *
 * Returns normal PoultryOps validation results so downstream Review,
 * duplicate checking and secure importing can reuse the existing pipeline.
 */
export function validateLegacyWorkbook(
  data: ArrayBuffer | Buffer,
): ValidationResult {
  const workbook = XLSX.read(data, {
    cellDates: false,
    cellNF: false,
    cellText: false,
  });

  const results: SheetValidationResult[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: "",
        raw: false,
      },
    ) as Record<string, any>[];

    if (!isLegacyPoultrySheet(sheetName, rows)) {
      continue;
    }

    const profile = getLegacySheetProfile(sheetName);

    // Every recognised legacy poultry sheet becomes its own flock/batch.
    results.push(
      buildLegacyFlockResult(
        profile,
        rows,
      ),
    );

    results.push(
      ...extractLegacyOperationalRecords(
        profile,
        rows,
      ),
    );
  }

  return {
    sheets: results,
  };
}