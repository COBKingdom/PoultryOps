import { supabase } from "@/lib/supabase";

type EggProductionRecordInput = {
  farm_id: string;
  flock_id: string;
  production_date: string;
  egg_count: number;
  cracked_eggs?: number | null;
  created_by?: string | null;
};

type EggProductionUpdateInput = {
  flock_id?: string;
  production_date?: string;
  egg_count?: number;
  cracked_eggs?: number | null;
};

export async function createEggProduction(
  record: EggProductionRecordInput
) {
  const { data, error } = await supabase
    .from("egg_production")
    .insert({
      farm_id: record.farm_id,
      flock_id: record.flock_id,
      production_date: record.production_date,
      egg_count: record.egg_count,
      cracked_eggs: record.cracked_eggs ?? 0,
      created_by: record.created_by ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getEggProduction(
  farmId: string
) {
  const { data, error } = await supabase
    .from("egg_production")
    .select(`
      *,
      flocks (
        flock_name,
        quantity
      ),
      created_by_profile:profiles!egg_production_created_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq("farm_id", farmId)
    .order("production_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}

export async function getTodayEggs(
  farmId: string
) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("egg_production")
    .select("egg_count")
    .eq("farm_id", farmId)
    .eq("production_date", today);

  if (error) throw error;

  const total =
    data?.reduce(
      (sum, row) =>
        sum + Number(row.egg_count || 0),
      0
    ) ?? 0;

  return total;
}

export async function getTodayCrackedEggs(
  farmId: string
) {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("egg_production")
    .select("cracked_eggs")
    .eq("farm_id", farmId)
    .eq("production_date", today);

  if (error) throw error;

  const total =
    data?.reduce(
      (sum, row) =>
        sum + Number(row.cracked_eggs || 0),
      0
    ) ?? 0;

  return total;
}

export async function updateEggProduction(
  id: string,
  record: EggProductionUpdateInput
) {
  const { error } = await supabase
    .from("egg_production")
    .update(record)
    .eq("id", id);

  if (error) throw error;
}