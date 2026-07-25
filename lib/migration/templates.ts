/**
 * PoultryOps Migration — Templates
 *
 * Phase A: Standard workbook template definitions.
 *
 * Each template defines the sheets in the PoultryOps Standard Workbook,
 * including field definitions, aliases (for existing spreadsheet compatibility),
 * and instructions content.
 *
 * IMPORTANT: Data sheets contain ONLY headers — no example rows.
 * Instructions, field descriptions, and example values live in the
 * Instructions sheet and/or safe metadata.
 */

import type {
  FieldDefinition,
  MigrationDataType,
  SheetTemplate,
} from "./types";

// ── Data Types ──────────────────────────────────────────────────────────

export const MIGRATION_DATA_TYPES: MigrationDataType[] = [
  "flocks",
  "egg_production",
  "feed_consumption",
  "feed_purchases",
  "health",
  "mortality",
  "sales",
  "expenses",
];

// ── Sheet Name Constants ────────────────────────────────────────────────

export const INSTRUCTIONS_SHEET_NAME = "Instructions";

export const SHEET_NAMES: Record<MigrationDataType, string> = {
  flocks: "Flocks",
  egg_production: "Egg Production",
  feed_consumption: "Feed Consumption",
  feed_purchases: "Feed Purchases",
  health: "Health Records",
  mortality: "Mortality",
  sales: "Sales",
  expenses: "Expenses",
};

// ── Field Definitions ───────────────────────────────────────────────────

// Flocks
const FLOCK_NAME_FIELD: FieldDefinition = {
  field: "flock_name",
  label: "Flock Name",
  type: "string",
  required: true,
  description: "Name of the poultry flock",
  example: "Layer House A",
  aliases: ["flock name", "name", "flock", "house", "house name"],
};

const BIRD_TYPE_FIELD: FieldDefinition = {
  field: "bird_type",
  label: "Bird Type",
  type: "enum",
  required: true,
  description: "Type of birds in the flock",
  example: "Layers",
  allowedValues: ["Layers", "Broilers", "Growers", "Cockerels"],
  aliases: ["bird type", "birds", "type of bird"],
};

const QUANTITY_FIELD: FieldDefinition = {
  field: "quantity",
  label: "Quantity",
  type: "integer",
  required: true,
  description: "Number of birds in the flock",
  example: "1000",
  aliases: ["quantity", "qty", "bird count", "number of birds", "no. of birds"],
};

// Egg Production
const PRODUCTION_DATE_FIELD: FieldDefinition = {
  field: "production_date",
  label: "Production Date",
  type: "date",
  required: true,
  description: "Date of egg collection (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["production date", "date", "egg date", "collection date", "record date"],
};

const FLOCK_NAME_REF_FIELD: FieldDefinition = {
  field: "flock_name",
  label: "Flock Name",
  type: "string",
  required: true,
  description: "Must match a flock name from the Flocks sheet",
  example: "Layer House A",
  aliases: ["flock name", "flock", "house", "house name"],
};

const EGG_COUNT_FIELD: FieldDefinition = {
  field: "egg_count",
  label: "Egg Count",
  type: "integer",
  required: true,
  description: "Total number of eggs collected",
  example: "250",
  aliases: ["egg count", "total egg production", "egg production", "eggs collected", "eggs"],
};

const CRACKED_EGGS_FIELD: FieldDefinition = {
  field: "cracked_eggs",
  label: "Cracked Eggs",
  type: "integer",
  required: false,
  description: "Number of cracked eggs",
  example: "5",
  default: 0,
  aliases: ["cracked eggs", "broken eggs", "damaged eggs"],
};

// Feed Consumption
const FEED_DATE_FIELD: FieldDefinition = {
  field: "feed_date",
  label: "Feed Date",
  type: "date",
  required: true,
  description: "Date feed was used (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["feed date", "date", "record date"],
};

const FEED_TYPE_FIELD: FieldDefinition = {
  field: "feed_type",
  label: "Feed Type",
  type: "enum",
  required: true,
  description: "Type of feed used",
  example: "Starter Feed",
  allowedValues: [
    "Starter Feed",
    "Grower Feed",
    "Layer Mash",
    "Broiler Starter",
    "Broiler Finisher",
    "Concentrate",
    "Supplement",
    "Other",
  ],
  aliases: ["feed type", "feed", "type"],
};

const QUANTITY_KG_FIELD: FieldDefinition = {
  field: "quantity_kg",
  label: "Quantity (kg)",
  type: "numeric",
  required: true,
  description: "Amount of feed used in kilograms",
  example: "50.5",
  aliases: ["quantity kg", "quantity", "qty", "feed used", "feed used per kg", "feed quantity", "feed consumption", "amount (kg)", "kg used"],
};

// Feed Purchases
const PURCHASE_DATE_FIELD: FieldDefinition = {
  field: "purchase_date",
  label: "Purchase Date",
  type: "date",
  required: true,
  description: "Date feed was purchased (YYYY-MM-DD)",
  example: "2024-01-10",
  aliases: ["purchase date", "date", "bought date", "acquisition date"],
};

const FEED_TYPE_PURCHASE_FIELD: FieldDefinition = {
  field: "feed_type",
  label: "Feed Type",
  type: "enum",
  required: true,
  description: "Type of feed purchased",
  example: "Starter",
  allowedValues: ["Starter", "Grower", "Finisher", "Layer Mash"],
  aliases: ["feed type", "feed", "type"],
};

const QUANTITY_KG_PURCHASE_FIELD: FieldDefinition = {
  field: "quantity_kg",
  label: "Quantity (kg)",
  type: "numeric",
  required: true,
  description: "Amount of feed purchased in kilograms",
  example: "100",
  aliases: ["quantity kg", "quantity", "qty", "feed bought", "feed bought per bag", "feed quantity", "amount (kg)", "kg"],
};

const COST_FIELD: FieldDefinition = {
  field: "cost",
  label: "Cost",
  type: "currency",
  required: false,
  description: "Total cost of the feed purchase",
  example: "5000",
  default: 0,
  aliases: ["cost", "price", "total", "amount", "total cost"],
};

const SUPPLIER_FIELD: FieldDefinition = {
  field: "supplier",
  label: "Supplier",
  type: "string",
  required: false,
  description: "Name of the feed supplier",
  example: "ABC Feeds Ltd",
  aliases: ["supplier", "vendor", "provider"],
};

// Health
const HEALTH_DATE_FIELD: FieldDefinition = {
  field: "health_date",
  label: "Health Date",
  type: "date",
  required: true,
  description: "Date of health activity (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["health date", "date", "treatment date", "record date"],
};

const TREATMENT_NAME_FIELD: FieldDefinition = {
  field: "treatment_name",
  label: "Treatment Name",
  type: "string",
  required: true,
  description: "Name of the medication or treatment",
  example: "Vitamin Supplements",
  aliases: ["treatment name", "medication administered", "medication", "treatment", "drug", "vaccine given", "medicine"],
};

const CATEGORY_FIELD: FieldDefinition = {
  field: "category",
  label: "Category",
  type: "enum",
  required: false,
  description: "Category of health activity",
  example: "Vaccine",
  default: "Treatment",
  allowedValues: [
    "Vaccine",
    "Antibiotic",
    "Vitamin",
    "Supplement",
    "Treatment",
    "Deworming",
    "Biosecurity",
    "Disinfectant",
    "Health Inspection",
  ],
  aliases: ["category", "type", "health category"],
};

const HEALTH_COST_FIELD: FieldDefinition = {
  field: "cost",
  label: "Cost",
  type: "currency",
  required: false,
  description: "Cost of the treatment",
  example: "500",
  default: 0,
  aliases: ["cost", "price", "amount", "medication price"],
};

const NOTES_FIELD: FieldDefinition = {
  field: "notes",
  label: "Notes",
  type: "string",
  required: false,
  description: "Additional notes",
  example: "Given to 50 birds in House A",
  aliases: ["notes", "remark", "comment", "remarks", "remark/comment", "description"],
};

const ISOLATED_BIRDS_FIELD: FieldDefinition = {
  field: "isolated_birds",
  label: "Isolated Birds",
  type: "integer",
  required: false,
  description: "Number of birds isolated due to illness",
  example: "3",
  default: 0,
  aliases: ["isolated birds", "number of isolated birds", "number of isolated bird", "isolated bird count"],
};

// Mortality
const MORTALITY_DATE_FIELD: FieldDefinition = {
  field: "mortality_date",
  label: "Mortality Date",
  type: "date",
  required: true,
  description: "Date of mortality (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["mortality date", "date", "death date", "record date"],
};

const MORTALITY_QUANTITY_FIELD: FieldDefinition = {
  field: "quantity",
  label: "Quantity",
  type: "integer",
  required: true,
  description: "Number of birds that died",
  example: "5",
  aliases: ["mortality", "quantity", "qty", "birds died", "dead birds", "loss", "mortality count"],
};

const REASON_FIELD: FieldDefinition = {
  field: "reason",
  label: "Reason",
  type: "enum",
  required: false,
  description: "Reason for mortality",
  example: "Disease",
  default: "Disease",
  allowedValues: [
    "Disease",
    "Heat Stress",
    "Predator Attack",
    "Injury",
    "Culled",
    "Feed Poisoning",
    "Water Contamination",
    "Unknown",
    "Other",
  ],
  aliases: ["reason", "cause", "mortality reason"],
};

// Sales
const SALE_DATE_FIELD: FieldDefinition = {
  field: "sale_date",
  label: "Sale Date",
  type: "date",
  required: true,
  description: "Date of sale (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["sale date", "date", "transaction date", "record date"],
};

const ITEM_TYPE_FIELD: FieldDefinition = {
  field: "item_type",
  label: "Item Type",
  type: "enum",
  required: true,
  description: "Type of item sold",
  example: "Egg Sales",
  allowedValues: [
    "Egg Sales",
    "Live Bird Sales",
    "Spent Layer Sales",
    "Broiler Sales",
    "Cockerel Sales",
    "Manure Sales",
    "Feed Sales",
    "Equipment Sales",
    "Other Income",
  ],
  aliases: ["item type", "type", "sale type", "product"],
  specialMappings: [
    { sourceColumn: "bird sold", value: "Live Bird Sales" },
    { sourceColumn: "egg sold", value: "Egg Sales" },
  ],
};

const SALE_QUANTITY_FIELD: FieldDefinition = {
  field: "quantity",
  label: "Quantity",
  type: "numeric",
  required: true,
  description: "Quantity of items sold",
  example: "250",
  aliases: ["quantity", "qty", "bird sold", "birds sold", "egg sold", "eggs sold", "amount sold"],
};

const UNIT_PRICE_FIELD: FieldDefinition = {
  field: "unit_price",
  label: "Unit Price",
  type: "currency",
  required: true,
  description: "Price per unit",
  example: "200",
  aliases: ["unit price", "price per unit", "price", "unit cost"],
};

const TOTAL_AMOUNT_FIELD: FieldDefinition = {
  field: "total_amount",
  label: "Total Amount",
  type: "currency",
  required: false,
  description: "Total sale amount (auto-calculated if omitted)",
  example: "50000",
  aliases: ["total amount", "total", "total price", "grand total"],
};

// Expenses
const EXPENSE_DATE_FIELD: FieldDefinition = {
  field: "expense_date",
  label: "Expense Date",
  type: "date",
  required: true,
  description: "Date of expense (YYYY-MM-DD)",
  example: "2024-01-15",
  aliases: ["expense date", "date", "transaction date", "record date"],
};

const EXPENSE_CATEGORY_FIELD: FieldDefinition = {
  field: "category",
  label: "Category",
  type: "enum",
  required: true,
  description: "Category of expense",
  example: "Staff Salaries",
  allowedValues: [
    "Staff Salaries",
    "Transportation",
    "Fuel & Generator",
    "Electricity",
    "Water Supply",
    "Maintenance & Repairs",
    "Equipment Purchase",
    "Marketing",
    "Professional Services",
    "Miscellaneous",
  ],
  aliases: ["category", "purpose", "expense category", "type"],
};

const AMOUNT_FIELD: FieldDefinition = {
  field: "amount",
  label: "Amount",
  type: "currency",
  required: true,
  description: "Expense amount",
  example: "5000",
  aliases: ["amount", "total", "cost", "price", "value", "expense"],
};

// ── Sheet Templates ─────────────────────────────────────────────────────

export const SHEET_TEMPLATES: Record<MigrationDataType, SheetTemplate> = {
  flocks: {
    dataType: "flocks",
    sheetName: SHEET_NAMES.flocks,
    fields: [FLOCK_NAME_FIELD, BIRD_TYPE_FIELD, QUANTITY_FIELD],
  },
  egg_production: {
    dataType: "egg_production",
    sheetName: SHEET_NAMES.egg_production,
    fields: [PRODUCTION_DATE_FIELD, FLOCK_NAME_REF_FIELD, EGG_COUNT_FIELD, CRACKED_EGGS_FIELD],
  },
  feed_consumption: {
    dataType: "feed_consumption",
    sheetName: SHEET_NAMES.feed_consumption,
    fields: [FEED_DATE_FIELD, FLOCK_NAME_REF_FIELD, FEED_TYPE_FIELD, QUANTITY_KG_FIELD],
  },
  feed_purchases: {
    dataType: "feed_purchases",
    sheetName: SHEET_NAMES.feed_purchases,
    fields: [PURCHASE_DATE_FIELD, FEED_TYPE_PURCHASE_FIELD, QUANTITY_KG_PURCHASE_FIELD, COST_FIELD, SUPPLIER_FIELD],
  },
  health: {
    dataType: "health",
    sheetName: SHEET_NAMES.health,
    fields: [HEALTH_DATE_FIELD, FLOCK_NAME_REF_FIELD, TREATMENT_NAME_FIELD, CATEGORY_FIELD, HEALTH_COST_FIELD, NOTES_FIELD, ISOLATED_BIRDS_FIELD],
  },
  mortality: {
    dataType: "mortality",
    sheetName: SHEET_NAMES.mortality,
    fields: [MORTALITY_DATE_FIELD, FLOCK_NAME_REF_FIELD, MORTALITY_QUANTITY_FIELD, REASON_FIELD],
  },
  sales: {
    dataType: "sales",
    sheetName: SHEET_NAMES.sales,
    fields: [SALE_DATE_FIELD, ITEM_TYPE_FIELD, SALE_QUANTITY_FIELD, UNIT_PRICE_FIELD, TOTAL_AMOUNT_FIELD, NOTES_FIELD],
  },
  expenses: {
    dataType: "expenses",
    sheetName: SHEET_NAMES.expenses,
    fields: [EXPENSE_DATE_FIELD, EXPENSE_CATEGORY_FIELD, AMOUNT_FIELD, NOTES_FIELD],
  },
};

// ── Instructions Sheet Content ──────────────────────────────────────────

export const INSTRUCTIONS_CONTENT: string[][] = [
  ["PoultryOps Standard Workbook"],
  [""],
  ["This workbook contains the following sheets:"],
  ["1. Flocks - Define your poultry flocks (processed first)"],
  ["2. Egg Production - Daily egg collection records"],
  ["3. Feed Consumption - Daily feed usage per flock"],
  ["4. Feed Purchases - Feed inventory purchases"],
  ["5. Health Records - Vaccinations, treatments, and medications"],
  ["6. Mortality - Daily mortality records per flock"],
  ["7. Sales - Egg sales, live bird sales, and other income"],
  ["8. Expenses - General farm expenses"],
  [""],
  ["IMPORTANT:"],
  ["- Do not modify the header row in any data sheet"],
  ["- Data sheets contain headers only — no example rows"],
  ["- Date format: YYYY-MM-DD (e.g., 2024-01-15)"],
  ["- Numeric fields: use plain numbers (e.g., 1000, not 1,000)"],
  ["- Currency fields: use plain numbers (e.g., 5000, not NGN 5,000)"],
  ["- Flock names in operational sheets must match a flock in the Flocks sheet"],
  ["- Flocks are processed before operational data"],
  [""],
  ["Field descriptions:"],
  ["- Required fields must have values"],
  ["- Optional fields can be left blank (defaults will be applied)"],
  ["- Enum fields must use one of the allowed values listed below"],
  [""],
  ["Allowed values:"],
  ["Bird Type: Layers, Broilers, Growers, Cockerels"],
  ["Feed Type (Consumption): Starter Feed, Grower Feed, Layer Mash, Broiler Starter, Broiler Finisher, Concentrate, Supplement, Other"],
  ["Feed Type (Purchases): Starter, Grower, Finisher, Layer Mash"],
  ["Health Category: Vaccine, Antibiotic, Vitamin, Supplement, Treatment, Deworming, Biosecurity, Disinfectant, Health Inspection"],
  ["Mortality Reason: Disease, Heat Stress, Predator Attack, Injury, Culled, Feed Poisoning, Water Contamination, Unknown, Other"],
  ["Sales Item Type: Egg Sales, Live Bird Sales, Spent Layer Sales, Broiler Sales, Cockerel Sales, Manure Sales, Feed Sales, Equipment Sales, Other Income"],
  ["Expense Category: Staff Salaries, Transportation, Fuel & Generator, Electricity, Water Supply, Maintenance & Repairs, Equipment Purchase, Marketing, Professional Services, Miscellaneous"],
  [""],
  ["Duplicate detection:"],
  ["- Potential duplicates are detected per data type"],
  ["- Duplicates are skipped by default"],
  ["- You can choose to import flagged duplicates manually"],
];
