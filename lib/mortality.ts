import { supabase } from "@/lib/supabase";

export async function createMortality(
  record: any
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getMortality(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select(`
        *,
        flocks (
          flock_name
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "mortality_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTotalMortality(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select("quantity")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + row.quantity,
      0
    ) || 0
  );
}

export async function getFlockMortality(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("mortality")
      .select("quantity")
      .eq("flock_id", flockId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + row.quantity,
      0
    ) || 0
  );
}

export async function updateMortality(
  id: string,
  updates: {
    flock_id: string;
    mortality_date: string;
    quantity: number;
    reason: string;
  }
) {
  const { error } =
    await supabase
      .from("mortality")
      .update(updates)
      .eq("id", id);

  if (error) throw error;
}
