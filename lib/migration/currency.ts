/**
 * PoultryOps Migration — Currency Parser
 *
 * Phase A: Parses currency-formatted strings into numeric values.
 *
 * Handles NGN, USD, EUR, GBP and other common currency formats:
 *   ₦5,000   → 5000
 *   N5,000   → 5000
 *   NGN 5,000 → 5000
 *   5,000    → 5000
 *   5000     → 5000
 *   $1,234.56 → 1234.56
 *   €1.234,56 → 1234.56
 *
 * Never stores formatted strings in numeric database columns.
 * Display formatting remains a UI concern (lib/currency.ts).
 */

import type { CurrencyParseResult } from "./types";

// Currency symbols sorted by length (longest first) to avoid partial matches
const CURRENCY_SYMBOLS: string[] = [
  "GH₵",
  "KSh",
  "C$",
  "A$",
  "₦",
  "N",
  "$",
  "€",
  "£",
  "₹",
  "R",
  "₩",
  "¥",
  "₪",
  "₺",
];

// ISO currency codes (case-insensitive)
const CURRENCY_CODES: string[] = [
  "NGN",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "ZAR",
  "GHS",
  "KES",
  "CAD",
  "AUD",
  "KRW",
  "JPY",
  "ILS",
  "TRY",
  "CNY",
  "RUB",
];

/**
 * Escape a string for use in a RegExp.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse a currency-formatted value into a numeric value.
 *
 * @param value - The raw value from the spreadsheet (string, number, etc.)
 * @returns An object with `value` (number or null) and `error` (string or null)
 */
export function parseCurrency(value: unknown): CurrencyParseResult {
  // Handle null/undefined/empty
  if (value === null || value === undefined || value === "") {
    return { value: null, error: "Empty value" };
  }

  // If already a number
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return { value: null, error: "Not a number" };
    }
    return { value: roundToTwo(value), error: null };
  }

  let str = String(value).trim();

  if (str === "") {
    return { value: null, error: "Empty value" };
  }

  // Remove currency symbols (longest first to avoid partial matches)
  for (const symbol of CURRENCY_SYMBOLS) {
    str = str.replace(new RegExp(escapeRegExp(symbol), "gi"), "");
  }

  // Remove currency codes (word-boundary, case-insensitive)
  for (const code of CURRENCY_CODES) {
    str = str.replace(new RegExp(`\\b${code}\\b`, "gi"), "");
  }

  // Remove all whitespace
  str = str.replace(/\s+/g, "");

  if (str === "") {
    return { value: null, error: "No numeric value found after stripping currency symbols" };
  }

  // Handle decimal/thousands separators
  const hasComma = str.includes(",");
  const hasPeriod = str.includes(".");

  if (hasComma && hasPeriod) {
    // Both present: the last separator is the decimal separator
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // Comma is decimal separator, period is thousands separator
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Period is decimal separator, comma is thousands separator
      str = str.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Only comma present
    const commaParts = str.split(",");
    if (
      commaParts.length === 2 &&
      commaParts[1].length === 2 &&
      /^\d{2}$/.test(commaParts[1])
    ) {
      // Likely a decimal separator (e.g., "1.234,56" → "1234.56")
      str = str.replace(",", ".");
    } else {
      // Treat as thousands separator (e.g., "5,000" → "5000")
      str = str.replace(/,/g, "");
    }
  }
  // If only period or no separator, leave as-is

  const num = parseFloat(str);

  if (Number.isNaN(num)) {
    return { value: null, error: `Unable to parse "${String(value)}" as a number` };
  }

  return { value: roundToTwo(num), error: null };
}

/**
 * Round a number to 2 decimal places (avoids floating-point issues).
 */
function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
