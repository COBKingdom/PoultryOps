
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateSale } from "@/lib/sales";
import {
  getCustomers,
  type CustomerBalance,
} from "@/lib/customers";
import { canEdit } from "@/lib/permissions/governance";
import SaveButton from "@/components/ui/save-button";
import { X } from "lucide-react";

type Props = {
  record: any;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  user: any;
  profile?: any;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-sm font-bold text-slate-700";

const itemTypes = [
  "Egg Sales",
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
  "Manure Sales",
  "Feed Sales",
  "Equipment Sales",
  "Other Income",
];

export default function EditSaleForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const [recordDate, setRecordDate] = useState(
    record.sale_date ||
      new Date().toISOString().split("T")[0]
  );

  const [itemType, setItemType] = useState(
    record.item_type || "Egg Sales"
  );

  const [customerId, setCustomerId] = useState(
    record.customer_id || ""
  );

  const [customers, setCustomers] = useState<
    CustomerBalance[]
  >([]);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [quantity, setQuantity] = useState(
    record.quantity?.toString() || ""
  );

  const [unitPrice, setUnitPrice] = useState(
    record.unit_price?.toString() || ""
  );

  const [notes, setNotes] = useState(
    record.notes || ""
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  const [governanceError, setGovernanceError] =
    useState<string | null>(null);

  const currency =
    profile?.currency ||
    record.currency ||
    "NGN";

  const currencySymbol =
    currency === "NGN"
      ? "₦"
      : currency === "USD"
      ? "$"
      : currency === "EUR"
      ? "€"
      : currency === "GBP"
      ? "£"
      : currency;

  const numericQuantity = Number(quantity);
  const numericUnitPrice = Number(unitPrice);

  const totalAmount =
    Number.isFinite(numericQuantity) &&
    Number.isFinite(numericUnitPrice)
      ? numericQuantity * numericUnitPrice
      : 0;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      if (!record.farm_id) return;

      try {
        setCustomersLoading(true);

        const result = await getCustomers(
          record.farm_id
        );

        if (!cancelled) {
          setCustomers(result);
        }
      } catch (err) {
        console.error(
          "Failed to load customers:",
          err
        );
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [record.farm_id]);

  useEffect(() => {
    const result = canEdit(
      {
        id: user?.id || "",
        role: profile?.role || "",
      },
      record
    );

    setGovernanceError(
      result.allowed
        ? null
        : result.reason ||
            "You cannot edit this record."
    );
  }, [user, profile, record]);

  async function handleSave() {
    if (governanceError || loading) return;

    setError(null);

    if (!recordDate) {
      setError("Please select a sale date.");
      return;
    }

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Quantity must be a whole number greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(numericUnitPrice) ||
      numericUnitPrice <= 0
    ) {
      setError(
        "Unit price must be greater than zero."
      );
      return;
    }

    const originalCustomerId =
      record.customer_id || "";

    const financialDetailsChanged =
      numericQuantity !== Number(record.quantity) ||
      numericUnitPrice !==
        Number(record.unit_price) ||
      customerId !== originalCustomerId ||
      itemType !== record.item_type;

    try {
      setLoading(true);

      /*
       * Protect existing payment allocations.
       *
       * A sale with allocated payments must not
       * have its financial details changed through
       * a direct table update.
       *
       * Such changes require a dedicated,
       * transactional payment-correction workflow.
       */
      if (financialDetailsChanged) {
        const { data, error: allocationError } =
          await supabase
            .from("customer_payment_allocations")
            .select("id")
            .eq("sale_id", record.id)
            .limit(1);

        if (allocationError) {
          throw new Error(
            "Unable to verify payment allocations. " +
              allocationError.message
          );
        }

        if (data && data.length > 0) {
          throw new Error(
            "This sale already has an allocated customer payment. " +
              "Its financial details cannot be changed here. " +
              "Use the payment-correction workflow instead."
          );
        }
      }

      await updateSale(record.id, {
        sale_date: recordDate,
        item_type: itemType,
        quantity: numericQuantity,
        unit_price: numericUnitPrice,
        total_amount: totalAmount,
        customer_id: customerId || null,
        notes,
      });

      await onSaved?.();

      setSuccess(true);
      onClose();
    } catch (err) {
      console.error("Failed to update sale:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the sale."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-h-[85dvh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Edit Sale
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Update the details of this sales record.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Edit Sale"
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {governanceError ? (
        <div className="space-y-4 overflow-y-auto p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {governanceError}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold"
          >
            Close
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label
                htmlFor="edit-sale-date"
                className={labelClass}
              >
                Sale Date
              </label>

              <input
                id="edit-sale-date"
                type="date"
                value={recordDate}
                onChange={(event) =>
                  setRecordDate(event.target.value)
                }
                className={inputClass}
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-sale-customer"
                className={labelClass}
              >
                Customer
              </label>

              <select
                id="edit-sale-customer"
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                className={inputClass}
              >
                <option value="">
                  {customersLoading
                    ? "Loading customers..."
                    : "No Customer / Cash Sale"}
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.customer_id}
                    value={customer.customer_id}
                  >
                    {customer.customer_code} —{" "}
                    {customer.name}
                    {customer.phone
                      ? ` — ${customer.phone}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-sale-item"
                className={labelClass}
              >
                Item / Sale Type
              </label>

              <select
                id="edit-sale-item"
                value={itemType}
                onChange={(event) =>
                  setItemType(event.target.value)
                }
                className={inputClass}
              >
                {!itemTypes.includes(itemType) && (
                  <option value={itemType}>
                    {itemType}
                  </option>
                )}

                {itemTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-sale-quantity"
                  className={labelClass}
                >
                  Quantity
                </label>

                <input
                  id="edit-sale-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-sale-price"
                  className={labelClass}
                >
                  Unit Price ({currencySymbol})
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    {currencySymbol}
                  </span>

                  <input
                    id="edit-sale-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={unitPrice}
                    onChange={(event) =>
                      setUnitPrice(event.target.value)
                    }
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Total Sale Amount
              </p>

              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {currencySymbol}
                {formatMoney(totalAmount)}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Quantity × Unit Price
              </p>
            </div>

            <div>
              <label
                htmlFor="edit-sale-notes"
                className={labelClass}
              >
                Notes
              </label>

              <textarea
                id="edit-sale-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={2}
                placeholder="Optional sale notes"
                className={`${inputClass} resize-y`}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            <SaveButton
              loading={loading}
              success={success}
              label="Update Sale"
            />
          </div>
        </form>
      )}
    </div>
  );
}
