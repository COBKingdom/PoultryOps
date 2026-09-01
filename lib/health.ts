"use client";

import { supabase } from "@/lib/supabase";

export type HealthRecordInput = {
  farm_id?: string;
  flock_id: string;
  health_date: string;
  treatment_name: string;
  category: string;
  quantity?: number | null;
  quantity_unit?: "ml" | "g" | null;
  unit_price?: number | null;
  total_price?: number | null;
  cost?: number | null;
  notes?: string | null;
  isolated_birds?: number | null;
  created_by?: string | null;
};

export async function createHealthRecord(record: HealthRecordInput) {
  const totalPrice =
    record.total_price ??
    (record.quantity != null && record.unit_price != null
      ? record.quantity * record.unit_price
      : record.cost ?? 0);

  const { data, error } = await supabase
    .from("health")
    .insert({
      ...record,
      total_price: totalPrice,
      cost: totalPrice,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating health record:", error);
    throw error;
  }

  return data;
}

export async function getHealthRecords(farmId: string) {
  const { data, error } = await supabase
    .from("health")
    .select(`
      *,
      flocks (
        flock_name
      )
    `)
    .eq("farm_id", farmId)
    .order("health_date", { ascending: false });

  if (error) {
    console.error("Error fetching health records:", error);
    throw error;
  }

  return data || [];
}

export async function updateHealth(
  id: string,
  updates: {
    flock_id?: string;
    health_date?: string;
    treatment_name?: string;
    category?: string;
    quantity?: number | null;
    quantity_unit?: "ml" | "g" | null;
    unit_price?: number | null;
    total_price?: number | null;
    cost?: number | null;
    notes?: string | null;
    isolated_birds?: number | null;
  }
) {
  const totalPrice =
    updates.total_price ??
    (updates.quantity != null && updates.unit_price != null
      ? updates.quantity * updates.unit_price
      : updates.cost ?? 0);

  const { data, error } = await supabase
    .from("health")
    .update({
      ...updates,
      total_price: totalPrice,
      cost: totalPrice,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating health record:", error);
    throw error;
  }

  return data;
}