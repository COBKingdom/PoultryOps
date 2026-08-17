import { supabase } from "@/lib/supabase";
import { getTotalBirdsSold } from "@/lib/sales";
import {
  getTotalMortality,
  getFlockMortality,
} from "@/lib/mortality";

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
 * Available Birds =
 *
 *   Starting Birds
 *   − Total Mortality
 *   − Birds Sold
 *
 * IMPORTANT:
 *
 * Birds in isolation are still alive and still
 * belong to their original flock.
 *
 * Therefore isolation does NOT reduce the farm's
 * Available Birds figure.
 *
 * Isolation is tracked separately as an operational
 * status/audit figure.
 *
 * When a bird dies in isolation, recordIsolationDeath()
 * creates a normal mortality record. That mortality
 * then permanently reduces Available Birds.
 *
 * Used by Dashboard, Reports, Analytics and Flocks.
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
 * Available birds for a single flock.
 *
 * For an individual flock, "available" means
 * birds currently available within that flock
 * for normal operations.
 *
 * Therefore active isolated birds are excluded
 * from this flock-level figure.
 *
 * Starting Birds
 * − Flock Mortality
 * − Birds Sold
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
    getTotalBirdsSold(
      flock.farm_id
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