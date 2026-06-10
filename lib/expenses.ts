import { supabase } from "@/lib/supabase";

export async function createExpense(
  expense: any
) {
  const { data, error } =
    await supabase
      .from("expenses")
      .insert(expense)
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function getExpenses(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("expenses")
      .select("*")
      .eq("farm_id", farmId)
      .order(
        "expense_date",
        { ascending: false }
      );

  if (error) throw error;

  return data;
}

export async function getTotalExpenses(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("expenses")
      .select("amount")
      .eq("farm_id", farmId);

  if (error) throw error;

  return (
    data?.reduce(
      (sum, row) =>
        sum + Number(row.amount),
      0
    ) || 0
  );
}