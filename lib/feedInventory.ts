import { supabase } from "@/lib/supabase";

export async function createFeedStock(
  record: any
) {
  const { data, error } =
    await supabase
      .from("feed_inventory")
      .insert(record)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getFeedInventory(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("feed_inventory")
      .select("*")
      .eq("farm_id", farmId)
      .order(
        "purchase_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTotalFeedPurchased(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("feed_inventory")
      .select("quantity_kg")
      .eq("farm_id", farmId);

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

export async function updateFeedStock(
  id: string,
  updates: {
    purchase_date: string;
    feed_type: string;
    quantity_kg: number;
    cost: number;
    supplier: string;
  }
) {
  const { error } =
    await supabase
      .from("feed_inventory")
      .update(updates)
      .eq("id", id);

  if (error) throw error;
}
