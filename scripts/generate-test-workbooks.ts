/**
 * Generate test workbooks for migration runtime integration testing.
 *
 * This script creates two XLSX files:
 * 1. migration-test-valid.xlsx - Clean data for successful import
 * 2. migration-test-errors.xlsx - Contains intentional errors for validation testing
 *
 * Run with: npx tsx scripts/generate-test-workbooks.ts
 */

import * as XLSX from "xlsx";
import { writeFileSync } from "fs";

// ── Test Data ─────────────────────────────────────────────────────────────

const FLOCKS_DATA = [
  {
    flock_name: "Migration Test Layers A",
    bird_type: "Layers",
    quantity: 100,
  },
  {
    flock_name: "Migration Test Broilers B",
    bird_type: "Broilers",
    quantity: 50,
  },
];

const EGG_PRODUCTION_DATA = [
  {
    flock_name: "Migration Test Layers A",
    production_date: "2024-01-15",
    egg_count: 250,
    cracked_eggs: 5,
  },
  {
    flock_name: "Migration Test Layers A",
    production_date: "2024-01-16",
    egg_count: 245,
    cracked_eggs: 3,
  },
  // Intentional workbook-internal duplicate (same date + flock)
  {
    flock_name: "Migration Test Layers A",
    production_date: "2024-01-15",
    egg_count: 250,
    cracked_eggs: 5,
  },
];

const FEED_CONSUMPTION_DATA = [
  {
    flock_name: "MIGRATION TEST LAYERS A", // Different case to test normalization
    feed_date: "2024-01-15",
    feed_type: "Layer Feed",
    quantity_kg: 50,
  },
];

const SALES_DATA = [
  {
    sale_date: "2024-01-15",
    item_type: "Egg Sales",
    quantity: 250,
    unit_price: 200,
    // total_amount intentionally left blank - should be calculated
  },
];

const EXPENSES_DATA = [
  {
    expense_date: "2024-01-15",
    category: "Staff Salaries",
    amount: "NGN 5,000", // Currency format - should parse to 5000
    notes: "January payroll",
  },
];

const ERROR_DATA_FLOCKS = [
  ...FLOCKS_DATA,
];

const ERROR_DATA_OPERATIONAL = [
  {
    flock_name: "Migration Test Unknown Flock", // Should cause blocking error
    production_date: "2024-01-15",
    egg_count: 100,
  },
];

// ── Workbook Generation ───────────────────────────────────────────────────

function createWorkbook(
  includeErrors: boolean = false,
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Instructions sheet
  const instructions = [
    ["PoultryOps Migration Test Workbook"],
    ["Generated for runtime integration testing"],
    [""],
    ["This workbook contains test data with identifiable names:"],
    ["- Migration Test Layers A"],
    ["- Migration Test Broilers B"],
    [""],
    ["After testing, these records should be cleaned up."],
  ];
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(instructions),
    "Instructions",
  );

  // Flocks sheet
  const flocksSheet = XLSX.utils.json_to_sheet(ERROR_DATA_FLOCKS);
  XLSX.utils.book_append_sheet(workbook, flocksSheet, "Flocks");

  // Egg Production sheet
  const eggProductionData = includeErrors
    ? ERROR_DATA_OPERATIONAL
    : EGG_PRODUCTION_DATA;
  const eggSheet = XLSX.utils.json_to_sheet(eggProductionData);
  XLSX.utils.book_append_sheet(workbook, eggSheet, "Egg Production");

  // Feed Consumption sheet
  const feedSheet = XLSX.utils.json_to_sheet(FEED_CONSUMPTION_DATA);
  XLSX.utils.book_append_sheet(workbook, feedSheet, "Feed Consumption");

  // Sales sheet
  const salesSheet = XLSX.utils.json_to_sheet(SALES_DATA);
  XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales");

  // Expenses sheet
  const expensesSheet = XLSX.utils.json_to_sheet(EXPENSES_DATA);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

  return workbook;
}

// ── Generate Files ────────────────────────────────────────────────────────

console.log("Generating test workbooks...");

const validWorkbook = createWorkbook(false);
const validBuffer = XLSX.write(validWorkbook, {
  bookType: "xlsx",
  type: "buffer",
});
writeFileSync("migration-test-valid.xlsx", validBuffer);
console.log("✓ Created migration-test-valid.xlsx");

const errorWorkbook = createWorkbook(true);
const errorBuffer = XLSX.write(errorWorkbook, {
  bookType: "xlsx",
  type: "buffer",
});
writeFileSync("migration-test-errors.xlsx", errorBuffer);
console.log("✓ Created migration-test-errors.xlsx");

console.log("\nTest workbooks generated successfully.");
console.log("\nContents of migration-test-valid.xlsx:");
console.log("- Flocks: 2 records (Migration Test Layers A, Migration Test Broilers B)");
console.log("- Egg Production: 3 records (2 unique + 1 intentional duplicate)");
console.log("- Feed Consumption: 1 record (case variation 'MIGRATION TEST LAYERS A')");
console.log("- Sales: 1 record (blank total_amount - should calculate)");
console.log("- Expenses: 1 record (NGN 5,000 currency format)");

console.log("\nContents of migration-test-errors.xlsx:");
console.log("- Flocks: 2 records");
console.log("- Egg Production: 1 record (Migration Test Unknown Flock - should error)");
console.log("- Feed Consumption: 1 record");
console.log("- Sales: 1 record");
console.log("- Expenses: 1 record");