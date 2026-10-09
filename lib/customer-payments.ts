
import { supabase } from "@/lib/supabase";

export type CustomerPayment = {
  id: string;
  farm_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

export type AcceptCustomerPaymentInput = {
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
};

export type CorrectCustomerPaymentInput = {
  paymentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
};

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

  if (error) throw error;

  return data || [];
}

export async function acceptCustomerPayment(
  input: AcceptCustomerPaymentInput
) {
  const {
    customerId,
    amount,
    paymentDate,
    paymentMethod,
    reference,
    notes,
  } = input;

  if (!customerId) {
    throw new Error("Please select a customer.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!paymentDate) {
    throw new Error("Payment date is required.");
  }

  if (!paymentMethod) {
    throw new Error("Payment method is required.");
  }

  const { data, error } = await supabase.rpc(
    "accept_customer_payment",
    {
      p_customer_id: customerId,
      p_amount: amount,
      p_payment_date: paymentDate,
      p_payment_method: paymentMethod,
      p_reference: reference?.trim() || null,
      p_notes: notes?.trim() || null,
    }
  );

  if (error) throw error;

  return data as string;
}

export async function correctCustomerPayment(
  input: CorrectCustomerPaymentInput
): Promise<string> {
  const {
    paymentId,
    amount,
    paymentDate,
    paymentMethod,
    reference,
    notes,
  } = input;

  if (!paymentId) {
    throw new Error("Payment record was not found.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!paymentDate) {
    throw new Error("Payment date is required.");
  }

  if (!paymentMethod.trim()) {
    throw new Error("Payment method is required.");
  }

  const { data, error } = await supabase.rpc(
    "correct_customer_payment",
    {
      p_payment_id: paymentId,
      p_amount: amount,
      p_payment_date: paymentDate,
      p_payment_method: paymentMethod.trim(),
      p_reference: reference?.trim() || null,
      p_notes: notes?.trim() || null,
    }
  );

  if (error) throw error;

  return data as string;
}
