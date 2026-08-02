import { supabase } from "@/lib/supabase";
import { getTotalBirds } from "@/lib/flocks";
import type { DateRange } from "@/lib/date-ranges";

/**
 * PoultryOps Reporting Engine
 *
 * All report queries use server-side date filtering via Supabase
 * `.gte()` / `.lte()` on the appropriate date column for each table.
 *
 * Date columns:
 *   egg_production → production_date
 *   feed_records   → feed_date
 *   mortality      → mortality_date
 *   expenses       → expense_date
 *   sales          → sale_date
 *   health         → health_date
 *
 * `flocks` (current bird count) is a live snapshot and is NOT date-filtered.
 */

export interface FarmReport {
  currentBirds: number;
  eggs: number;
  feed: number;
  mortality: number;
  revenue: number;
  expenses: number;
  profit: number;
}

/**
 * Eggs produced within the date range (server-side filtered).
 */
async function getEggsInRange(farmId: string, range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from("egg_production")
    .select("egg_count")
    .eq("farm_id", farmId)
    .gte("production_date", range.start)
    .lte("production_date", range.end);

  if (error) throw error;

  return data?.reduce((sum, row) => sum + row.egg_count, 0) ?? 0;
}

/**
 * Feed consumed (kg) within the date range (server-side filtered).
 */
async function getFeedInRange(farmId: string, range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from("feed_records")
    .select("quantity_kg")
    .eq("farm_id", farmId)
    .gte("feed_date", range.start)
    .lte("feed_date", range.end);

  if (error) throw error;

  return data?.reduce((sum, row) => sum + Number(row.quantity_kg), 0) ?? 0;
}

/**
 * Mortality count within the date range (server-side filtered).
 */
async function getMortalityInRange(farmId: string, range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from("mortality")
    .select("quantity")
    .eq("farm_id", farmId)
    .gte("mortality_date", range.start)
    .lte("mortality_date", range.end);

  if (error) throw error;

  return data?.reduce((sum, row) => sum + row.quantity, 0) ?? 0;
}

/**
 * Total expenses within the date range (server-side filtered).
 */
async function getExpensesInRange(farmId: string, range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("farm_id", farmId)
    .gte("expense_date", range.start)
    .lte("expense_date", range.end);

  if (error) throw error;

  return data?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
}

/**
 * Total revenue within the date range (server-side filtered).
 */
async function getRevenueInRange(farmId: string, range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("farm_id", farmId)
    .gte("sale_date", range.start)
    .lte("sale_date", range.end);

  if (error) throw error;

  return data?.reduce((sum, row) => sum + Number(row.total_amount), 0) ?? 0;
}

/**
 * Generates a full farm report for the given date range.
 *
 * All time-series metrics (eggs, feed, mortality, revenue, expenses) are
 * filtered server-side by the supplied DateRange. The current bird count
 * is a live snapshot (not date-filtered).
 */
export async function getFarmReport(
  farmId: string,
  range: DateRange
): Promise<FarmReport> {
  const [birds, eggs, feed, mortality, expenses, revenue] = await Promise.all([
    getTotalBirds(farmId),
    getEggsInRange(farmId, range),
    getFeedInRange(farmId, range),
    getMortalityInRange(farmId, range),
    getExpensesInRange(farmId, range),
    getRevenueInRange(farmId, range),
  ]);

  return {
    currentBirds: birds - mortality,
    eggs,
    feed,
    mortality,
    revenue,
    expenses,
    profit: revenue - expenses,
  };
}