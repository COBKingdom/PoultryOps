import { supabase } from "@/lib/supabase";

export async function getUserRole(
  farmId: string,
  userId: string
) {
  const { data, error } =
    await supabase
      .from("farm_users")
      .select("role")
      .eq("farm_id", farmId)
      .eq("user_id", userId)
      .single();

  if (error) {
    console.error(error);

    return null;
  }

  return data?.role;
}