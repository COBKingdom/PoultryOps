import { supabase } from "@/lib/supabase";

export async function getDashboardData(
  userId: string
) {
  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

  if (!profile?.farm_id) {
    return null;
  }

  const { data: farm } =
    await supabase
      .from("farms")
      .select("*")
      .eq("id", profile.farm_id)
      .single();

  const { data: subscription } =
    await supabase
      .from("subscriptions")
      .select("*")
      .eq("farm_id", profile.farm_id)
      .single();

  return {
    profile,
    farm,
    subscription,
  };
}