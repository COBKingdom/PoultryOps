import { supabase } from "@/lib/supabase";

export type Customer = {
  id: string;
  farm_id: string;
  customer_code: string;
  name: string;
  phone: string;
  address: string | null;
  location: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerBalance = {
  customer_id: string;
  farm_id: string;
  customer_code: string;
  name: string;
  phone: string;
  address: string | null;
  location: string | null;
  active: boolean;
  total_sales: number;
  total_paid: number;
  outstanding_balance: number;
  credit_balance: number;
};

export type CustomerInput = {
  name: string;
  phone: string;
  address?: string;
  location?: string;
  notes?: string;
  active?: boolean;
};

export type CustomerSaleBalance = {
  sale_id: string;
  farm_id: string;
  customer_id: string;
  sale_date: string;
  item_type: string | null;
  sale_category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  flock_id: string | null;
};

export type CustomerPayment = {
  id: string;
  farm_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

export async function getCustomers(
  farmId: string
): Promise<CustomerBalance[]> {
  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("farm_id", farmId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((customer) => ({
    customer_id: customer.customer_id,
    farm_id: customer.farm_id,
    customer_code: customer.customer_code,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    location: customer.location,
    active: customer.active,
    total_sales: Number(customer.total_sales ?? 0),
    total_paid: Number(customer.total_paid ?? 0),
    outstanding_balance: Number(customer.outstanding_balance ?? 0),
    credit_balance: Number(customer.credit_balance ?? 0),
  }));
}

export async function getCustomer(
  farmId: string,
  customerId: string
): Promise<CustomerBalance | null> {
  const { data, error } = await supabase
    .from("customer_balances")
    .select("*")
    .eq("farm_id", farmId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    customer_id: data.customer_id,
    farm_id: data.farm_id,
    customer_code: data.customer_code,
    name: data.name,
    phone: data.phone,
    address: data.address,
    location: data.location,
    active: data.active,
    total_sales: Number(data.total_sales ?? 0),
    total_paid: Number(data.total_paid ?? 0),
    outstanding_balance: Number(data.outstanding_balance ?? 0),
    credit_balance: Number(data.credit_balance ?? 0),
  };
}

export async function getCustomerRecord(
  farmId: string,
  customerId: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("farm_id", farmId)
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCustomer(
  farmId: string,
  input: CustomerInput
): Promise<Customer> {
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (!name) {
    throw new Error("Customer name is required.");
  }

  if (!phone) {
    throw new Error("Customer phone number is required.");
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      farm_id: farmId,
      name,
      phone,
      address: input.address?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCustomer(
  farmId: string,
  customerId: string,
  input: CustomerInput
): Promise<Customer> {
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (!name) {
    throw new Error("Customer name is required.");
  }

  if (!phone) {
    throw new Error("Customer phone number is required.");
  }

  const { data, error } = await supabase
    .from("customers")
    .update({
      name,
      phone,
      address: input.address?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", farmId)
    .eq("id", customerId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deactivateCustomer(
  farmId: string,
  customerId: string
) {
  const { error } = await supabase
    .from("customers")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", farmId)
    .eq("id", customerId);

  if (error) {
    throw error;
  }
}

export async function activateCustomer(
  farmId: string,
  customerId: string
) {
  const { error } = await supabase
    .from("customers")
    .update({
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", farmId)
    .eq("id", customerId);

  if (error) {
    throw error;
  }
}

export async function getCustomerSales(
  farmId: string,
  customerId: string
): Promise<CustomerSaleBalance[]> {
  const { data, error } = await supabase
    .from("customer_sale_balances")
    .select("*")
    .eq("farm_id", farmId)
    .eq("customer_id", customerId)
    .order("sale_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((sale) => ({
    sale_id: sale.sale_id,
    farm_id: sale.farm_id,
    customer_id: sale.customer_id,
    sale_date: sale.sale_date,
    item_type: sale.item_type,
    sale_category: sale.sale_category,
    quantity: Number(sale.quantity ?? 0),
    unit_price: Number(sale.unit_price ?? 0),
    total_amount: Number(sale.total_amount ?? 0),
    amount_paid: Number(sale.amount_paid ?? 0),
    outstanding_amount: Number(sale.outstanding_amount ?? 0),
    flock_id: sale.flock_id ?? null,
  }));
}

export async function getCustomerPayments(
  farmId: string,
  customerId: string
): Promise<CustomerPayment[]> {
  const { data, error } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("farm_id", farmId)
    .eq("customer_id", customerId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((payment) => ({
    id: payment.id,
    farm_id: payment.farm_id,
    customer_id: payment.customer_id,
    amount: Number(payment.amount ?? 0),
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    reference: payment.reference,
    notes: payment.notes,
    created_at: payment.created_at,
  }));
}