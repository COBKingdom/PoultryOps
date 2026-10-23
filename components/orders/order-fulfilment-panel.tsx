"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, PackageCheck } from "lucide-react";
import {
  getOrderFulfilments,
  getTotalFulfilledQuantity,
  recordOrderFulfilment,
  type OrderFulfilment,
} from "@/lib/order-fulfilment";

type OrderFulfilmentPanelProps = {
  orderId: string;
  orderedQuantity: number;
  currency: string;
  disabled?: boolean;
  onSuccess?: () => void | Promise<void>;
};

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  throw new Error(
    "This browser cannot generate a secure transaction reference. Please use a supported browser.",
  );
}

export default function OrderFulfilmentPanel({
  orderId,
  orderedQuantity,
  currency,
  disabled = false,
  onSuccess,
}: OrderFulfilmentPanelProps) {
  const [fulfilments, setFulfilments] = useState<OrderFulfilment[]>([]);
  const [quantity, setQuantity] = useState("");
  const [fulfilledAt, setFulfilledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  const loadFulfilments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await getOrderFulfilments(orderId);
      setFulfilments(rows);
    } catch (err) {
      console.error("Could not load order fulfilment history:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the fulfilment history.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadFulfilments();
  }, [loadFulfilments]);

  const fulfilledQuantity = getTotalFulfilledQuantity(fulfilments);
  const remainingQuantity = Math.max(
    0,
    Number(orderedQuantity) - fulfilledQuantity,
  );
  const parsedQuantity = Number(quantity);
  const quantityIsValid =
    quantity.trim() !== "" &&
    Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= remainingQuantity;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || saving || !quantityIsValid) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await recordOrderFulfilment({
        orderId,
        quantity: parsedQuantity,
        idempotencyKey,
        fulfilledAt: fulfilledAt
          ? new Date(fulfilledAt).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      });

      await loadFulfilments();

      setQuantity("");
      setFulfilledAt("");
      setNotes("");
      setIdempotencyKey(createIdempotencyKey());

      setSuccess(
        `Recorded ${formatQuantity(result.quantity_fulfilled ?? parsedQuantity)} supplied. ` +
          `${formatQuantity(result.quantity_remaining ?? Math.max(0, remainingQuantity - parsedQuantity))} remaining.`,
      );

      await onSuccess?.();
    } catch (err) {
      console.error("Could not record order fulfilment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not record fulfilment. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">
            Collections &amp; fulfilment
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Record only quantities actually supplied or collected. Payment
            alone does not confirm a sale.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Ordered</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatQuantity(Number(orderedQuantity))}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Supplied</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {formatQuantity(fulfilledQuantity)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">
            {formatQuantity(remainingQuantity)}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{success}</span>
        </div>
      )}

      {!disabled && remainingQuantity > 0 && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor={`fulfilment-quantity-${orderId}`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Quantity supplied
            </label>
            <input
              id={`fulfilment-quantity-${orderId}`}
              type="number"
              min="1"
              max={remainingQuantity}
              step="1"
              inputMode="numeric"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={saving || loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder={`Up to ${formatQuantity(remainingQuantity)}`}
            />
            <p className="mt-1 text-xs text-slate-500">
              Maximum remaining: {formatQuantity(remainingQuantity)}
            </p>
          </div>

          <div>
            <label
              htmlFor={`fulfilment-date-${orderId}`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Date and time supplied (optional)
            </label>
            <input
              id={`fulfilment-date-${orderId}`}
              type="datetime-local"
              value={fulfilledAt}
              onChange={(event) => setFulfilledAt(event.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to use the server recording time.
            </p>
          </div>

          <div>
            <label
              htmlFor={`fulfilment-notes-${orderId}`}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Collection or delivery notes (optional)
            </label>
            <textarea
              id={`fulfilment-notes-${orderId}`}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="Who collected the goods? Any delivery reference?"
            />
          </div>

          <button
            type="submit"
            disabled={saving || loading || !quantityIsValid}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Recording fulfilment…
              </>
            ) : (
              <>
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                Record supplied quantity
              </>
            )}
          </button>

          <p className="text-xs text-slate-500">
            {currency} amounts and the resulting sale will be calculated and
            validated by the server. Do not use this form until the database
            fulfilment function has been installed and tested.
          </p>
        </form>
      )}

      {!disabled && remainingQuantity <= 0 && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          This order line is fully supplied.
        </p>
      )}

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Fulfilment history
        </h4>

        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading history…
          </p>
        ) : fulfilments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No quantities have been recorded as supplied yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {fulfilments.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatQuantity(Number(item.quantity))} supplied
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(item.fulfilled_at)}
                    </p>
                    {item.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  {item.sale_id ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Sale recorded
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      Sale reference pending
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
