/**
 * PoultryOps Date Range Utilities
 *
 * Reusable date-range infrastructure for the reporting engine.
 * Used by ReportFilter and all date-filtered data queries across the app.
 *
 * All ranges are computed in the user's local timezone and returned as
 * ISO date strings (YYYY-MM-DD) suitable for Supabase `.gte()` / `.lte()` filters.
 */

export type DateRangePreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "any_day"
  | "custom";

export interface DateRange {
  /** Inclusive start date (YYYY-MM-DD) */
  start: string;

  /** Inclusive end date (YYYY-MM-DD) */
  end: string;
}

export interface DateRangeSelection {
  preset: DateRangePreset;
  range: DateRange;
}

/**
 * Returns a YYYY-MM-DD string for the given Date in local time.
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Returns the start of the week (Sunday) for the given date.
 */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();

  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);

  return d;
}

/**
 * Returns the end of the week (Saturday) for the given date.
 */
function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);

  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return end;
}

/**
 * Returns the start of the month for the given date.
 */
function startOfMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

/**
 * Returns the end of the month for the given date.
 */
function endOfMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

/**
 * Returns the start of last month.
 */
function startOfLastMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );
}

/**
 * Returns the end of last month.
 */
function endOfLastMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
}

/**
 * Computes a DateRange for the given preset.
 *
 * For "any_day", the caller should supply the selected date
 * as customStart. The same date is then used as both start and end.
 *
 * For "custom", the caller must supply valid start/end strings.
 */
export function getDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();

  switch (preset) {
    case "today": {
      const today = toDateString(now);

      return {
        start: today,
        end: today,
      };
    }

    case "this_week": {
      return {
        start: toDateString(startOfWeek(now)),
        end: toDateString(endOfWeek(now)),
      };
    }

    case "this_month": {
      return {
        start: toDateString(startOfMonth(now)),
        end: toDateString(endOfMonth(now)),
      };
    }

    case "last_month": {
      return {
        start: toDateString(startOfLastMonth(now)),
        end: toDateString(endOfLastMonth(now)),
      };
    }

    case "any_day": {
      if (!customStart) {
        const today = toDateString(now);

        return {
          start: today,
          end: today,
        };
      }

      return {
        start: customStart,
        end: customStart,
      };
    }

    case "custom": {
      if (!customStart || !customEnd) {
        const today = toDateString(now);

        return {
          start: today,
          end: today,
        };
      }

      return {
        start: customStart,
        end: customEnd,
      };
    }

    default: {
      const today = toDateString(now);

      return {
        start: today,
        end: today,
      };
    }
  }
}

/**
 * Default selection (Today).
 */
export function getDefaultDateRangeSelection(): DateRangeSelection {
  return {
    preset: "today",
    range: getDateRange("today"),
  };
}

/**
 * Human-readable label for a preset.
 */
export function getPresetLabel(
  preset: DateRangePreset
): string {
  switch (preset) {
    case "today":
      return "Today";

    case "this_week":
      return "This Week";

    case "this_month":
      return "This Month";

    case "last_month":
      return "Last Month";

    case "any_day":
      return "Any Day";

    case "custom":
      return "Custom Range";

    default:
      return "Today";
  }
}

/**
 * Formats a DateRange as a human-readable string.
 */
export function formatDateRange(
  range: DateRange
): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const start = new Date(
    range.start + "T00:00:00"
  ).toLocaleDateString("en-US", opts);

  const end = new Date(
    range.end + "T00:00:00"
  ).toLocaleDateString("en-US", opts);

  return range.start === range.end
    ? start
    : `${start} – ${end}`;
}