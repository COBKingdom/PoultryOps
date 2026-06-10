import { supabase } from "@/lib/supabase";

export async function createSale(
  sale: any
) {
  const { data, error } =
    await supabase
      .from("sales")
      .insert(sale)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getSales(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("sales")
      .select("*")
      .eq("farm_id", farmId)
      .order(
        "sale_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTotalRevenue(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("sales")
      .select("total_amount")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum +
        Number(
          row.total_amount
        ),
      0
    ) || 0
  );
}