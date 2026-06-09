import { supabase } from "@/lib/supabase";

export async function getCurrentFarm(
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select(`
      farm_id,
      farms (*)
    `)
    .eq("id", userId)
    .single();

  return data;
}