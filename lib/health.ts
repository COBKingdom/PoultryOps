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