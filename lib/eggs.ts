import { supabase } from "@/lib/supabase";

export async function createEggProduction(
  record: any
) {
  const { data, error } =
    await supabase
      .from("egg_production")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getEggProduction(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("egg_production")
      .select(`
        *,
        flocks (
          flock_name
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "production_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTodayEggs(
  farmId: string
) {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const { data, error } =
    await supabase
      .from("egg_production")
      .select("egg_count")
      .eq("farm_id", farmId)
      .eq(
        "production_date",
        today
      );

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + row.egg_count,
      0
    ) || 0
  );
}