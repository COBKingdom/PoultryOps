import { supabase } from "@/lib/supabase";

export async function createHealthRecord(
  record: any
) {
  const { data, error } =
    await supabase
      .from("health")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getHealthRecords(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("health")
      .select(`
        *,
        flocks (
          flock_name
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "health_date",
        {
          ascending: false,
        }
      );

  if (error) throw error;

  return data;
}

export async function updateHealth(
  id: string,
  updates: {
    flock_id: string;
    health_date: string;
    treatment_name: string;
    category: string;
    cost: number;
    notes: string;
  }
) {
  const { error } =
    await supabase
      .from("health")
      .update(updates)
      .eq("id", id);

  if (error) throw error;
}
