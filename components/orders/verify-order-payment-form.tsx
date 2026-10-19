"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  orderId?: string;
  orderBatchId?: string;
  currency: string;
  onSuccess: () => Promise<void>;
};

type PaymentResult = {
  success?: boolean;
  duplicate?: boolean;
  payment_status?: string;
  outstanding_after_payment?: number;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function createRequestKey(): string {
  return crypto.randomUUID();
}

export default function VerifyOrderPaymentForm({
  orderId,
  orderBatchId,
  currency,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Keep the same key when a request fails or its outcome is uncertain.
  // The database uses this key to prevent a retry recording the payment twice.
  const [idempotencyKey, setIdempotencyKey] = useState(createRequestKey);

  const money = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    if (!paymentDate || !paymentMethod.trim()) {
      setError("Payment date and method are required.");
      return;
    }

    if (!orderId && !orderBatchId) {
      setError("The order or checkout batch could not be identified.");
      return;
    }

    if (orderId && orderBatchId) {
      setError("This form must identify either an order or a checkout batch, not both.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm that you have independently verified receipt of ${money(
        paymentAmount
      )} from the customer? This will record a payment and may create the order's Sales records.`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "verify_order_payment_idempotent",
        {
          p_order_id: orderId ?? null,
          p_order_batch_id: orderBatchId ?? null,
          p_amount: paymentAmount,
          p_payment_date: paymentDate,
          p_payment_method: paymentMethod.trim(),
          p_reference: reference.trim() || null,
          p_notes: notes.trim() || null,
          p_idempotency_key: idempotencyKey,
        }
      );

      if (rpcError) throw rpcError;

      const result = data as PaymentResult;

      if (!result?.success) {
        throw new Error("The database did not confirm the payment.");
      }

      const outstanding = Number(result.outstanding_after_payment ?? 0);

      if (!Number.isFinite(outstanding)) {
        throw new Error(
          "The payment was recorded, but the outstanding balance could not be read. Refresh the order before retrying."
        );
      }

      setSuccess(
        `${result.duplicate ? "This payment was already recorded. " : "Payment recorded. "}` +
          `Status: ${result.payment_status ?? "updated"}. ` +
          `Outstanding: ${money(outstanding)}.`
      );

      // The request has a confirmed result. A new key is now safe for
      // the next intentional payment, such as a later instalment.
      setIdempotencyKey(createRequestKey());

      setAmount("");
      setReference("");
      setNotes("");

      await onSuccess();
    } catch (err) {
      console.error("Order payment verification failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm the payment result. Refresh the order and check its payment history before attempting another payment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
    >
      <div>
        <h4 className="font-semibold text-slate-900">
          Record verified payment
        </h4>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Only record money the farm has actually received. A receipt alone
          does not establish that a transfer succeeded. Partial payments are
          supported. Repeating the same request is protected against duplicate
          payment recording.
        </p>
      </div>

      <label className="block space-y-1 text-xs font-medium text-slate-600">
        Amount received ({currency}) *
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs font-medium text-slate-600">
          Payment date *
          <input
            required
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </label>

        <label className="block space-y-1 text-xs font-medium text-slate-600">
          Payment method *
          <select
            required
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={inputClass}
            disabled={saving}
          >
            <option>Bank transfer</option>
            <option>Cash</option>
            <option>POS</option>
            <option>USSD</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-xs font-medium text-slate-600">
        Transaction reference (optional)
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={200}
          className={inputClass}
          disabled={saving}
        />
      </label>

      <label className="block space-y-1 text-xs font-medium text-slate-600">
        Notes (optional)
        <textarea
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={1000}
          className={inputClass}
          disabled={saving}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-800">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {saving ? "Recording payment..." : "Confirm and record payment"}
      </button>
    </form>
  );
}
