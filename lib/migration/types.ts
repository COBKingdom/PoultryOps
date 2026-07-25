/**
 * PoultryOps Migration — Core Types
 *
 * Phase A: Type definitions for the migration system.
 * No database writes. No auth. No API routes.
 */

// ── Data Types ──────────────────────────────────────────────────────────

export type MigrationDataType =
  | "flocks"
  | "egg_production"
  | "feed_consumption"
  | "feed_purchases"
  | "health"
  | "mortality"
  | "sales"
  | "expenses";

export type FieldType =
  | "string"
  | "integer"
  | "numeric"
  | "date"
  | "currency"
  | "enum";

// ── Field & Template Definitions ────────────────────────────────────────

export interface SpecialMapping {
  /** Normalized source column name that triggers this mapping */
  sourceColumn: string;
  /** Value to assign to the PoultryOps field */
  value: string;
}

export interface FieldDefinition {
  /** PoultryOps field name (matches database column) */
  field: string;
  /** Human-readable label */
  label: string;
  /** Field type for validation */
  type: FieldType;
  /** Whether the field is required */
  required: boolean;
  /** Description for the Instructions sheet */
  description?: string;
  /** Allowed values for enum fields */
  allowedValues?: string[];
  /** Example value for the Instructions sheet */
  example?: string;
  /** Default value when the column is absent */
  default?: string | number;
  /** Alternative header names that map to this field */
  aliases?: string[];
  /** Special column-to-value mappings (e.g. "bird sold" → "Live Bird Sales") */
  specialMappings?: SpecialMapping[];
}

export interface SheetTemplate {
  dataType: MigrationDataType;
  sheetName: string;
  fields: FieldDefinition[];
}

// ── Detection & Mapping ─────────────────────────────────────────────────

export type MappingConfidence = "auto" | "manual";

export interface ColumnMapping {
  /** Original column header from the spreadsheet */
  sourceColumn: string;
  /** PoultryOps field name */
  poultryOpsField: string;
  /** Data type this mapping belongs to */
  dataType: MigrationDataType;
  /** How confident the mapping is */
  confidence: MappingConfidence;
}

export interface SheetMetadata {
  sheetName: string;
  /** Original headers from the first row */
  headers: string[];
  /** Normalized headers (lowercase, trimmed, special chars removed) */
  normalizedHeaders: string[];
  /** Data types detected for this sheet */
  detectedTypes: MigrationDataType[];
  /** Number of data rows (excluding header) */
  rowCount: number;
  /** Column mappings per detected data type */
  mappings: Partial<Record<MigrationDataType, ColumnMapping[]>>;
}

// ── Validation ──────────────────────────────────────────────────────────

export type RowStatus = "valid" | "warning" | "error";

export interface RowValidation {
  /** 1-based row number in the spreadsheet (row 1 = header) */
  rowIndex: number;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  /** Normalized data ready for database insert */
  mappedData: Record<string, any>;
  /** Whether this row is a potential duplicate */
  isDuplicate: boolean;
}

export interface SheetValidationResult {
  sheetName: string;
  dataType: MigrationDataType;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
  rows: RowValidation[];
  columnMappings: ColumnMapping[];
}

// ── Parse & Validation Results ──────────────────────────────────────────

export interface ParseResult {
  sheets: SheetMetadata[];
}

export interface ValidationResult {
  sheets: SheetValidationResult[];
}

// ── Currency ────────────────────────────────────────────────────────────

export interface CurrencyParseResult {
  value: number | null;
  error: string | null;
}

// ── Duplicate Detection ─────────────────────────────────────────────────

export interface DuplicateRule {
  dataType: MigrationDataType;
  /** Fields that together form a unique fingerprint */
  fields: string[];
}

// ── Flock Resolution ────────────────────────────────────────────────────

export interface FlockResolution {
  flockName: string;
  flockId: string | null;
  resolved: boolean;
}
