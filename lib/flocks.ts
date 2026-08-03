import { supabase } from "@/lib/supabase";
import { getTotalBirdsSold } from "@/lib/sales";
import { getTotalMortality, getFlockMortality } from "@/lib/mortality";

export async function createFlock(
  flock: any
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .insert({
        ...flock,
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    query = query.is("archived_at", null);
  }

  const { data, error } =
    await query.order(
      "created_at",
      { ascending: false }
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
        sum + flock.quantity,
      0
    ) || 0
  );
}

/**
 * Shared source of truth for the operational bird figure.
 *
 * Available Birds =
 *   Starting Birds (sum of flock quantities)
 *   − Total Mortality (all mortality records)
 *   − Birds Sold (bird-related sale records)
 *
 * Used by Dashboard, Reports, Analytics and Flocks so every
 * surface shows the same calculation.
 */
export async function getAvailableBirds(
  farmId: string
) {
  const [startingBirds, mortality, birdsSold] =
    await Promise.all([
      getTotalBirds(farmId),
      getTotalMortality(farmId),
      getTotalBirdsSold(farmId),
    ]);

  return Math.max(
    0,
    startingBirds - mortality - birdsSold
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
 * Available birds for a single flock:
 * Starting Birds (flock.quantity) − Flock Mortality − Birds Sold.
 */
export async function getFlockAvailableBirds(
  flockId: string
) {
  const flock = await getFlockById(flockId);
  if (!flock) return 0;

  const [mortality, birdsSold] = await Promise.all([
    getFlockMortality(flockId),
    getTotalBirdsSold(flock.farm_id),
  ]);

  return Math.max(
    0,
    Number(flock.quantity) - mortality - birdsSold
  );
}
