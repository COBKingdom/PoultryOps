import { supabase } from "@/lib/supabase";

export async function getSubscription(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("subscriptions")
      .select("*")
      .eq("farm_id", farmId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}