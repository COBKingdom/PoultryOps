import { supabase } from "@/lib/supabase";

export async function createFeedRecord(
  record: any
) {
  const { data, error } =
    await supabase
      .from("feed_records")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getFeedRecords(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("feed_records")
      .select(`
        *,
        flocks (
          flock_name
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "feed_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTodayFeed(
  farmId: string
) {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const { data, error } =
    await supabase
      .from("feed_records")
      .select("quantity_kg")
      .eq("farm_id", farmId)
      .eq("feed_date", today);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum +
        Number(
          row.quantity_kg
        ),
      0
    ) || 0
  );
}

export async function updateFeedRecord(
  id: string,
  updates: {
    flock_id: string;
    feed_date: string;
    feed_type: string;
    quantity_kg: number;
  }
) {
  const { error } =
    await supabase
      .from("feed_records")
      .update(updates)
      .eq("id", id);

  if (error) throw error;
}
