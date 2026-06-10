import { supabase } from "@/lib/supabase";

export async function createMedication(
  record: any
) {
  const { data, error } =
    await supabase
      .from("medications")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getMedications(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("medications")
      .select(`
        *,
        flocks (
          flock_name
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "medication_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}