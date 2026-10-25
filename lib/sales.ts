import { supabase } from "@/lib/supabase";

export type SaleRecord = {
  id: string;
  farm_id: string;
  flock_id: string | null;
  customer_id: string | null;
  sale_category: string | null;
  sale_date: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  unit_of_sale?: string | null;
  notes: string | null;
  [key: string]: any;
};

export type SaleUpdate = {
  sale_date: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_id: string | null;
  unit_of_sale: string;
  notes: string;
};

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

export async function createSale(
  sale: Partial<SaleRecord> & Record<string, any>
): Promise<SaleRecord> {
  const { data, error } = await supabase
    .from("sales")
    .insert(sale)
    .select()
    .single();

  if (error) throw error;

  return data as SaleRecord;
}

export async function getSales(
  farmId: string
): Promise<SaleRecord[]> {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customer:customers (
        id,
        name,
        customer_code,
        phone
      )
    `)
    .eq("farm_id", farmId)
    .order("sale_date", { ascending: false });

  if (error) throw error;

  return (data || []) as SaleRecord[];
}

export async function getTotalRevenue(
  farmId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) => sum + Number(row.total_amount || 0),
      0
    ) || 0
  );
}

export async function getTotalBirdsSold(
  farmId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("sales")
    .select("quantity, item_type")
    .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        BIRD_SALE_TYPES.includes(row.item_type)
          ? sum + Number(row.quantity || 0)
          : sum,
      0
    ) || 0
  );
}

export async function getFlockBirdsSold(
  flockId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("sales")
    .select("quantity, item_type, flock_id")
    .eq("flock_id", flockId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        BIRD_SALE_TYPES.includes(row.item_type)
          ? sum + Number(row.quantity || 0)
          : sum,
      0
    ) || 0
  );
}

export async function updateSale(
  id: string,
  updates: SaleUpdate
): Promise<void> {
  const { error } = await supabase
    .from("sales")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}
