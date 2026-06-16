import { supabase } from "@/lib/supabase";

export async function updateFarm(
  farmId: string,
  updates: {
    name?: string;
    currency?: string;
  }
) {
  const { data, error } =
    await supabase
      .from("farms")
      .update(updates)
      .eq("id", farmId)
      .select()
      .single();

  if (error) throw error;

  return data;
}