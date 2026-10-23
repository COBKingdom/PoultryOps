import { supabase } from "@/lib/supabase";

export type RecordOrderFulfilmentInput = {
  orderId: string;
  quantity: number;
  idempotencyKey: string;
  fulfilledAt?: string;
  notes?: string;
};

export type OrderFulfilment = {
  id: string;
  farm_id: string;
  order_id: string;
  quantity: number;
  fulfilled_at: string;
  notes: string | null;
  sale_id: string | null;
  idempotency_key: string;
  created_at: string;
};

export type RecordOrderFulfilmentResult = {
  success: boolean;
  fulfilment_id?: string;
  sale_id?: string;
  quantity_fulfilled?: number;
  quantity_remaining?: number;
  message?: string;
};

function requireNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

/**
 * Records an actual quantity supplied against an order line.
 *
 * The database RPC is responsible for farm authorization, locking the
 * order line, preventing over-fulfilment, creating the corresponding sale,
 * preserving inventory safeguards, and enforcing idempotency.
 *
 * This function deliberately does not insert sales directly from the client.
 */
export async function recordOrderFulfilment(
  input: RecordOrderFulfilmentInput
): Promise<RecordOrderFulfilmentResult> {
  const orderId = requireNonEmpty(input.orderId, "Order");

  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Fulfilment quantity must be a positive whole number.");
  }

  const idempotencyKey = requireNonEmpty(
    input.idempotencyKey,
    "Idempotency key"
  );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idempotencyKey
    )
  ) {
    throw new Error("Idempotency key must be a valid UUID.");
  }

  const fulfilledAt = input.fulfilledAt?.trim() || null;
  const notes = input.notes?.trim() || null;

  const { data, error } = await supabase.rpc(
    "record_order_fulfilment",
    {
      p_order_id: orderId,
      p_quantity: input.quantity,
      p_idempotency_key: idempotencyKey,
      p_fulfilled_at: fulfilledAt,
      p_notes: notes,
    }
  );

  if (error) throw error;

  if (!data || typeof data !== "object") {
    throw new Error("The server returned an invalid fulfilment response.");
  }

  const result = data as RecordOrderFulfilmentResult;

  if (result.success !== true) {
    throw new Error(result.message || "Could not record fulfilment.");
  }

  return result;
}

/**
 * Retrieves the fulfilment history for one order line.
 * Row-level security remains enforced by Supabase.
 */
export async function getOrderFulfilments(
  orderId: string
): Promise<OrderFulfilment[]> {
  const id = requireNonEmpty(orderId, "Order");

  const { data, error } = await supabase
    .from("order_fulfilments")
    .select(
      "id, farm_id, order_id, quantity, fulfilled_at, notes, sale_id, idempotency_key, created_at"
    )
    .eq("order_id", id)
    .order("fulfilled_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []) as OrderFulfilment[];
}

/**
 * Calculates the quantity already fulfilled from the history returned
 * by the database. The database remains authoritative for preventing
 * over-fulfilment during concurrent requests.
 */
export function getTotalFulfilledQuantity(
  fulfilments: Pick<OrderFulfilment, "quantity">[]
): number {
  return fulfilments.reduce(
    (total, fulfilment) => total + Number(fulfilment.quantity || 0),
    0
  );
}
