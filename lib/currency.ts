/**
 * PoultryOps Currency Formatter
 * 
 * Standardizes currency display across the entire application.
 * Uses Nigerian Naira (₦) as the default currency.
 */

export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    currency = "NGN",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options || {};

  if (amount === null || amount === undefined || amount === "") {
    return "₦0";
  }

  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
}

export function formatNumber(
  value: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options || {};

  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}