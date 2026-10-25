"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalDateString } from "@/lib/date-utils";
import { supabase } from "@/lib/supabase";
import {
  CustomerBalance,
  getCustomers,
} from "@/lib/customers";
import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
};

type SaleCategory = "Bird Sales" | "Egg Sales" | "Other Sales";

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

const EGG_SALE_TYPES = ["Egg Sales"];

const OTHER_SALE_TYPES = [
  "Manure Sales",
  "Feed Sales",
  "Equipment Sales",
  "Other Income",
];

const UNIT_OPTIONS = [
  "Birds",
  "Crates",
  "Trays",
  "Bags",
  "Kg",
  "Grams",
  "Pieces",
  "Litres",
  "Units",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

function getDefaultUnit(
  category: SaleCategory,
  itemType: string
): string {
  if (category === "Egg Sales") return "Crates";
  if (category === "Bird Sales") return "Birds";
  if (itemType === "Manure Sales") return "Bags";
  if (itemType === "Feed Sales") return "Bags";
  if (itemType === "Equipment Sales") return "Pieces";
  return "Units";
}

export default function AddSaleForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [saleCategory, setSaleCategory] =
    useState<SaleCategory>("Egg Sales");

  const [itemType, setItemType] = useState("Egg Sales");
  const [flockId, setFlockId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<CustomerBalance[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [applyCredit, setApplyCredit] = useState(true);
  const [notes, setNotes] = useState("");
  const [recordDate, setRecordDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unitOfSale, setUnitOfSale] = useState("Crates");

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        const result = await getCustomers(farmId);
        if (!cancelled) setCustomers(result);
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    }

    if (farmId) void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [farmId]);

  useEffect(() => {
    if (saleCategory === "Bird Sales") {
      setItemType(BIRD_SALE_TYPES[0]);
    } else if (saleCategory === "Egg Sales") {
      setItemType(EGG_SALE_TYPES[0]);
    } else {
      setItemType(OTHER_SALE_TYPES[0]);
    }

    setUnitOfSale(
      getDefaultUnit(saleCategory, saleCategory === "Bird Sales"
        ? BIRD_SALE_TYPES[0]
        : saleCategory === "Egg Sales"
          ? EGG_SALE_TYPES[0]
          : OTHER_SALE_TYPES[0])
    );

    if (saleCategory === "Other Sales") {
      setFlockId("");
    }
  }, [saleCategory]);

  const requiresFlock =
    saleCategory === "Bird Sales" ||
    saleCategory === "Egg Sales";

  const allowsFlock = requiresFlock;

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.customer_id === customerId
      ) || null,
    [customers, customerId]
  );

  const totalAmount =
    Number(quantity || 0) * Number(unitPrice || 0);

  const availableCredit = selectedCustomer
    ? Number(selectedCustomer.credit_balance || 0)
    : 0;

  const creditApplied =
    customerId && applyCredit
      ? Math.min(availableCredit, totalAmount)
      : 0;

  const remainingAfterCredit = Math.max(
    totalAmount - creditApplied,
    0
  );

  const enteredAmountPaid = Number(amountPaid || 0);

  const effectiveAmountPaid = Math.min(
    enteredAmountPaid,
    remainingAfterCredit
  );

  const balance = Math.max(
    remainingAfterCredit - effectiveAmountPaid,
    0
  );

  const isCustomerSale = Boolean(customerId);

  const paymentExceedsRemaining =
    enteredAmountPaid > remainingAfterCredit + 0.005;

  const saleTypes =
    saleCategory === "Bird Sales"
      ? BIRD_SALE_TYPES
      : saleCategory === "Egg Sales"
        ? EGG_SALE_TYPES
        : OTHER_SALE_TYPES;

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function handleItemTypeChange(nextItemType: string) {
    setItemType(nextItemType);
    setUnitOfSale(getDefaultUnit(saleCategory, nextItemType));
  }

  async function handleSave() {
    if (!farmId) {
      alert("Farm information is not available. Please refresh and try again.");
      return;
    }

    if (!recordDate) {
      alert("Please select a sale date.");
      return;
    }

    const numericQuantity = Number(quantity);
    const numericUnitPrice = Number(unitPrice);

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      alert("Quantity must be a whole number greater than zero.");
      return;
    }

    if (
      !Number.isFinite(numericUnitPrice) ||
      numericUnitPrice <= 0
    ) {
      alert("Please enter a valid unit price greater than zero.");
      return;
    }

    if (!unitOfSale) {
      alert("Please select a unit of sale.");
      return;
    }

    if (requiresFlock && !flockId) {
      alert("Please select a flock for this sale.");
      return;
    }

    if (paymentExceedsRemaining) {
      alert(
        "Amount paid cannot exceed the remaining balance after customer credit."
      );
      return;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      alert("The sale amount must be greater than zero.");
      return;
    }

    try {
      setLoading(true);

      if (isCustomerSale) {
        const { data, error } = await supabase.rpc(
          "record_customer_sale",
          {
            p_farm_id: farmId,
            p_customer_id: customerId,
            p_flock_id:
              allowsFlock && flockId ? flockId : null,
            p_sale_category: saleCategory,
            p_sale_date: recordDate,
            p_item_type: itemType,
            p_quantity: numericQuantity,
            p_unit_price: numericUnitPrice,
            p_total_amount: totalAmount,
            p_unit_of_sale: unitOfSale,
            p_amount_paid: effectiveAmountPaid,
            p_apply_credit: applyCredit,
            p_notes: notes,
          }
        );

        if (error) throw error;

        if (!data) {
          throw new Error("The sale could not be created.");
        }
      } else {
        const { createSale } = await import("@/lib/sales");

        await createSale({
          farm_id: farmId,
          flock_id:
            allowsFlock && flockId ? flockId : null,
          customer_id: null,
          sale_category: saleCategory,
          sale_date: recordDate,
          item_type: itemType,
          quantity: numericQuantity,
          unit_price: numericUnitPrice,
          total_amount: totalAmount,
          unit_of_sale: unitOfSale,
          notes,
        });
      }

      await onSaved?.();

      setFlockId("");
      setCustomerId("");
      setQuantity("");
      setUnitPrice("");
      setAmountPaid("");
      setApplyCredit(true);
      setNotes("");
      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to save sale:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save the sale. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="p-5 sm:p-7">
        <div className="mb-7 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14M5 12h14"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Record Sale
              </h2>
              <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
                Record a sale, payment and customer balance in one transaction.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="space-y-5"
        >
          <div>
            <label className={labelClass} htmlFor="sale-date">
              Sale Date
            </label>
            <input
              id="sale-date"
              type="date"
              value={recordDate}
              onChange={(event) => setRecordDate(event.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="sale-category">
              Sale Category
            </label>
            <select
              id="sale-category"
              value={saleCategory}
              onChange={(event) =>
                setSaleCategory(event.target.value as SaleCategory)
              }
              className={inputClass}
              required
            >
              <option value="Bird Sales">Bird Sales</option>
              <option value="Egg Sales">Egg Sales</option>
              <option value="Other Sales">Other Sales</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="sale-customer">
              Customer
            </label>
            <select
              id="sale-customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
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
                  {customer.customer_code} — {customer.name}
                  {customer.phone ? ` — ${customer.phone}` : ""}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Outstanding
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ₦
                    {formatAmount(
                      Number(selectedCustomer.outstanding_balance || 0)
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Available Credit
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-700">
                    ₦{formatAmount(availableCredit)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {allowsFlock && (
            <div>
              <label className={labelClass} htmlFor="sale-flock">
                Flock
              </label>
              <select
                id="sale-flock"
                value={flockId}
                onChange={(event) => setFlockId(event.target.value)}
                className={inputClass}
                required={requiresFlock}
              >
                <option value="">Select flock</option>
                {flocks.map((flock: any) => (
                  <option key={flock.id} value={flock.id}>
                    {flock.flock_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="sale-item">
              Item
            </label>
            <select
              id="sale-item"
              value={itemType}
              onChange={(event) =>
                handleItemTypeChange(event.target.value)
              }
              className={inputClass}
              required
            >
              {saleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="sale-unit">
                Unit of Sale
              </label>
              <select
                id="sale-unit"
                value={unitOfSale}
                onChange={(event) => setUnitOfSale(event.target.value)}
                className={inputClass}
                required
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                For example, 50 crates or 50 birds.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="sale-quantity">
                Quantity ({unitOfSale.toLowerCase()})
              </label>
              <input
                id="sale-quantity"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="sale-unit-price">
              Unit Price (₦ per {unitOfSale.toLowerCase()})
            </label>
            <input
              id="sale-unit-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-slate-50/80">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Amount
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Quantity × price per {unitOfSale.toLowerCase()}
                </p>
              </div>
              <p className="text-xl font-bold tracking-tight text-slate-900">
                ₦{formatAmount(totalAmount)}
              </p>
            </div>

            {isCustomerSale && availableCredit > 0 && (
              <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Apply Customer Credit
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Available: ₦{formatAmount(availableCredit)}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyCredit}
                    onChange={(event) => setApplyCredit(event.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {applyCredit && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <span className="text-xs font-medium text-blue-800">
                      Credit applied
                    </span>
                    <span className="text-sm font-bold text-blue-800">
                      ₦{formatAmount(creditApplied)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="px-4 py-4 sm:px-5">
              <label className={labelClass} htmlFor="sale-amount-paid">
                Amount Paid (₦)
              </label>
              <input
                id="sale-amount-paid"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 ${
                  paymentExceedsRemaining
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                }`}
              />

              {paymentExceedsRemaining && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  Maximum additional payment: ₦
                  {formatAmount(remainingAfterCredit)}
                </p>
              )}
            </div>

            <div className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:mx-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Balance
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Remaining after payments and credit
                </p>
              </div>
              <p
                className={`text-xl font-bold tracking-tight ${
                  balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ₦{formatAmount(balance)}
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="sale-notes">
              Notes
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                Optional
              </span>
            </label>
            <input
              id="sale-notes"
              placeholder="Add any relevant details..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <SaveButton
              loading={loading}
              success={success}
              label="Save Sale"
            />
            <p className="mt-3 text-center text-xs text-slate-400">
              Please review the sale details before saving.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
