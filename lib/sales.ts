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
          row.total_amount || 0
        ),
      0
    ) || 0
  );
}

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

/**
 * Total number of birds sold from the farm.
 *
 * Only bird-related sale types count toward
 * birds removed from the farm.
 *
 * This is intentionally farm-wide and is used
 * by farm-level Available Birds calculations.
 */
export async function getTotalBirdsSold(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("sales")
      .select("quantity, item_type")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) => {
        if (
          BIRD_SALE_TYPES.includes(
            row.item_type
          )
        ) {
          return (
            sum +
            Number(
              row.quantity || 0
            )
          );
        }

        return sum;
      },
      0
    ) || 0
  );
}

/**
 * Total number of birds sold from one flock.
 *
 * IMPORTANT:
 *
 * This calculation is deliberately restricted
 * to the supplied flock_id.
 *
 * A sale belonging to another flock must never
 * reduce the Available Birds figure of this flock.
 *
 * Only bird-related sale types count.
 */
export async function getFlockBirdsSold(
  flockId: string
) {
  const { data, error } =
    await supabase
      .from("sales")
      .select(
        "quantity, item_type, flock_id"
      )
      .eq(
        "flock_id",
        flockId
      );

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) => {
        if (
          BIRD_SALE_TYPES.includes(
            row.item_type
          )
        ) {
          return (
            sum +
            Number(
              row.quantity || 0
            )
          );
        }

        return sum;
      },
      0
    ) || 0
  );
}

export async function updateSale(
  id: string,
  updates: {
    sale_date: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    notes: string;
  }
) {
  const { error } =
    await supabase
      .from("sales")
      .update(updates)
      .eq("id", id);

  if (error) throw error;
}