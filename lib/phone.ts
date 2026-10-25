/**
 * Shared, dependency-free phone helpers for international customer numbers.
 *
 * PoultryOps stores customer phone numbers as international E.164-style values
 * with an explicit leading "+". These helpers never infer a country code: a
 * number without "+" is not treated as international.
 */

const MIN_INTERNATIONAL_DIGITS = 8;
const MAX_INTERNATIONAL_DIGITS = 15;

/**
 * Remove common visual separators from the part of a phone number that follows
 * the leading "+".
 */
function compactPhoneDigits(value: string): string {
  return value.replace(/[\s().-]/g, "");
}

/**
 * Validate that `value` is an international phone number with an explicit "+"
 * country calling code.
 *
 * Throws an Error when the value is missing a country code, contains invalid
 * characters, or is too short/long to be plausible.
 */
export function validateInternationalPhone(value: string): void {
  if (typeof value !== "string") {
    throw new Error("Phone number is required.");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Phone number is required.");
  }

  if (!trimmed.startsWith("+")) {
    throw new Error(
      "Phone number must include an explicit international country calling code starting with +."
    );
  }

  const digits = compactPhoneDigits(trimmed.slice(1));

  if (!/^\d+$/.test(digits)) {
    throw new Error("Phone number may contain only digits and common formatting characters.");
  }

  if (digits.startsWith("0")) {
    throw new Error("Country calling code cannot start with 0.");
  }

  if (
    digits.length < MIN_INTERNATIONAL_DIGITS ||
    digits.length > MAX_INTERNATIONAL_DIGITS
  ) {
    throw new Error(
      `Phone number must contain between ${MIN_INTERNATIONAL_DIGITS} and ${MAX_INTERNATIONAL_DIGITS} digits.`
    );
  }
}

/**
 * Returns true when `value` is a valid international phone number.
 */
export function isValidInternationalPhone(value: string): boolean {
  try {
    validateInternationalPhone(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalise a valid international phone number to the digits-only form used by
 * wa.me URLs (for example "2348012345678").
 */
export function normalizePhoneForWhatsApp(value: string): string {
  validateInternationalPhone(value);
  return value.trim().slice(1).replace(/\D/g, "");
}

// Aliases for callers that prefer different naming.
export const validatePhoneForWhatsApp = validateInternationalPhone;
export const normalizeInternationalPhone = normalizePhoneForWhatsApp;
export const toWhatsAppPhone = normalizePhoneForWhatsApp;
export const isValidPhoneForWhatsApp = isValidInternationalPhone;
