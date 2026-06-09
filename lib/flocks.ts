import { supabase } from "@/lib/supabase";

export async function createFlock(
  flock: any
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .insert(flock)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getFlocks(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("flocks")
      .select("*")
      .eq("farm_id", farmId)
      .order(
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