import { supabase } from "@/lib/supabase";
import { getTotalBirdsSold } from "@/lib/sales";
import {
  getTotalMortality,
  getFlockMortality,
} from "@/lib/mortality";

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

/**
 * Creates a new flock.
 */
export async function createFlock(
  flock: any
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .insert({
        ...flock,
        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

/**
 * Updates a flock.
 */
export async function updateFlock(
  id: string,
  flock: any
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .update({
        ...flock,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}

/**
 * Archives a flock.
 */
export async function archiveFlock(
  id: string
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .update({
        archived_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}

/**
 * Gets flocks for a farm.
 *
 * Archived flocks are excluded by default.
 */
export async function getFlocks(
  farmId: string,
  includeArchived = false
) {
  let query = supabase
    .from("flocks")
    .select("*")
    .eq("farm_id", farmId);

  if (!includeArchived) {
    query = query.is(
      "archived_at",
      null
    );
  }

  const { data, error } =
    await query.order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) throw error;

  return data;
}

/**
 * Gets total starting birds across a farm.
 */
export async function getTotalBirds(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .select("quantity")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, flock) =>
        sum +
        Number(
          flock.quantity || 0
        ),
      0
    ) || 0
  );
}

/**
 * Shared source of truth for the operational
 * farm bird figure.
 *
 * Farm Available Birds =
 *
 *   Starting Birds
 *   − Total Mortality
 *   − Birds Sold
 *
 * Active isolation does NOT reduce the farm-level
 * available figure because isolated birds are still
 * alive and still belong to their original flock.
 */
export async function getAvailableBirds(
  farmId: string
) {
  const [
    startingBirds,
    mortality,
    birdsSold,
  ] = await Promise.all([
    getTotalBirds(farmId),
    getTotalMortality(farmId),
    getTotalBirdsSold(farmId),
  ]);

  return Math.max(
    0,
    startingBirds -
      mortality -
      birdsSold
  );
}

/**
 * Gets the total number of flock records.
 */
export async function getTotalFlocks(
  farmId: string
) {
  const { count, error } =
    await supabase
      .from("flocks")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("farm_id", farmId);

  if (error) throw error;

  return count || 0;
}

/**
 * Gets all flocks for a farm.
 */
export async function getFarmFlocks(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .select("*")
      .eq("farm_id", farmId)
      .order(
        "flock_name"
      );

  if (error) throw error;

  return data;
}

/**
 * Gets one flock by ID.
 */
export async function getFlockById(
  id: string
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .select("*")
      .eq("id", id)
      .single();

  if (error) throw error;

  return data;
}

/**
 * Gets birds sold from ONE specific flock.
 *
 * This is deliberately different from
 * getTotalBirdsSold(), which is farm-wide.
 */
async function getFlockBirdsSold(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("sales")
      .select(
        "quantity, item_type"
      )
      .eq(
        "flock_id",
        flockId
      );

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) => {
        if (
          BIRD_SALE_TYPES.includes(
            row.item_type
          )
        ) {
          return (
            sum +
            Number(
              row.quantity || 0
            )
          );
        }

        return sum;
      },
      0
    ) || 0
  );
}

/**
 * Available birds for a single flock.
 *
 * Starting Birds
 * − Flock Mortality
 * − Birds Sold from THIS flock
 * − Active Isolated Birds
 */
export async function getFlockAvailableBirds(
  flockId: string
) {
  const flock =
    await getFlockById(
      flockId
    );

  if (!flock) return 0;

  const [
    mortality,
    birdsSold,
    isolatedBirds,
  ] = await Promise.all([
    getFlockMortality(
      flockId
    ),
    getFlockBirdsSold(
      flockId
    ),
    getIsolatedBirdCountForFlock(
      flockId
    ),
  ]);

  return Math.max(
    0,
    Number(
      flock.quantity || 0
    ) -
      mortality -
      birdsSold -
      isolatedBirds
  );
}

/**
 * Returns the currently active isolated birds
 * for one specific flock.
 *
 * Deceased birds are excluded because their death
 * has already been recorded in Mortality.
 */
async function getIsolatedBirdCountForFlock(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("isolation_records")
      .select(
        `
          quantity,
          returned_quantity,
          deceased_quantity
        `
      )
      .eq(
        "flock_id",
        flockId
      )
      .eq(
        "status",
        "active"
      );

  if (error) throw error;

  return (
    data?.reduce(
      (sum, record) =>
        sum +
        Math.max(
          0,
          Number(
            record.quantity || 0
          ) -
            Number(
              record.returned_quantity ||
                0
            ) -
            Number(
              record.deceased_quantity ||
                0
            )
        ),
      0
    ) || 0
  );
}