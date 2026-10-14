/**
 * PoultryOps Date Utilities
 *
 * Keeps date-only values (YYYY-MM-DD) as calendar dates,
 * independent of the browser's timezone.
 *
 * Timestamp values continue to use normal JavaScript date
 * parsing and local timezone formatting.
 */

/**
 * Formats a date for display.
 *
 * Date-only values are parsed from their calendar components
 * to prevent UTC-to-local timezone shifts.
 * Timestamp values retain normal local-time formatting.
 */
export function formatDateOnly(
  value?: string | null,
  month: "short" | "long" = "short"
): string {
  if (!value) return "Not recorded";

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  let date: Date;

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);

    date = new Date(year, monthIndex, day);

    // Reject invalid calendar dates instead of silently normalising them.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    ) {
      return "Not recorded";
    }
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}

/**
 * Returns the current date in the user's local timezone as YYYY-MM-DD.
 * Use for date input defaults instead of UTC-based toISOString().
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
