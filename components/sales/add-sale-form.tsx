
"use client";

import { useEffect, useMemo, useState } from "react";
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

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
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        const result = await getCustomers(farmId);
        setCustomers(result);
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        setCustomersLoading(false);
      }
    }

    if (farmId) loadCustomers();
  }, [farmId]);

  useEffect(() => {
    if (saleCategory === "Bird Sales") {
      setItemType(BIRD_SALE_TYPES[0]);
      return;
    }

    if (saleCategory === "Egg Sales") {
      setItemType(EGG_SALE_TYPES[0]);
      return;
    }

    setItemType(OTHER_SALE_TYPES[0]);
  }, [saleCategory]);

  const requiresFlock = saleCategory === "Bird Sales";

  const allowsFlock =
    saleCategory === "Bird Sales" ||
    saleCategory === "Egg Sales";

  function handleCategoryChange(category: SaleCategory) {
    setSaleCategory(category);

    if (category === "Other Sales") {
      setFlockId("");
    }
  }

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
    enteredAmountPaid > remainingAfterCredit;

  async function handleSave() {
    if (requiresFlock && !flockId) {
      alert("Please select a flock for this bird sale.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (!unitPrice || Number(unitPrice) < 0) {
      alert("Please enter a valid unit price.");
      return;
    }

    if (paymentExceedsRemaining) {
      alert(
        "Amount paid cannot exceed the remaining balance after customer credit."
      );
      return;
    }

    if (totalAmount <= 0) {
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
            p_quantity: Number(quantity),
            p_unit_price: Number(unitPrice),
            p_total_amount: totalAmount,
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
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          total_amount: totalAmount,
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

      setTimeout(() => {
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
      {/* Blue accent */}
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="p-5 sm:p-7">
        {/* HEADER */}
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-5"
        >
          {/* DATE */}
          <div>
            <label className={labelClass} htmlFor="sale-date">
              Sale Date
            </label>
            <input
              id="sale-date"
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* SALE CATEGORY */}
          <div>
            <label className={labelClass} htmlFor="sale-category">
              Sale Category
            </label>
            <select
              id="sale-category"
              value={saleCategory}
              onChange={(e) =>
                handleCategoryChange(e.target.value as SaleCategory)
              }
              className={inputClass}
              required
            >
              <option value="Bird Sales">Bird Sales</option>
              <option value="Egg Sales">Egg Sales</option>
              <option value="Other Sales">Other Sales</option>
            </select>
          </div>

          {/* CUSTOMER */}
          <div>
            <label className={labelClass} htmlFor="sale-customer">
              Customer
            </label>
            <select
              id="sale-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputClass}
            >
              <option value="">
                {customersLoading
                  ? "Loading Customers..."
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
                    ₦{formatAmount(
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

          {/* FLOCK */}
          {allowsFlock && (
            <div>
              <label className={labelClass} htmlFor="sale-flock">
                Flock
                {!requiresFlock && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                )}
              </label>

              <select
                id="sale-flock"
                value={flockId}
                onChange={(e) => setFlockId(e.target.value)}
                className={inputClass}
                required={requiresFlock}
              >
                <option value="">
                  {requiresFlock
                    ? "Select Flock"
                    : "No Flock / Not Applicable"}
                </option>

                {flocks.map((flock: any) => (
                  <option key={flock.id} value={flock.id}>
                    {flock.flock_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ITEM */}
          <div>
            <label className={labelClass} htmlFor="sale-item">
              Item
            </label>
            <select
              id="sale-item"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
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

          {/* QUANTITY AND UNIT PRICE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="sale-quantity">
                Quantity
              </label>
              <input
                id="sale-quantity"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="sale-unit-price">
                Unit Price (₦)
              </label>
              <input
                id="sale-unit-price"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-slate-50/80">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Amount
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Quantity × unit price
                </p>
              </div>

              <p className="text-xl font-bold tracking-tight text-slate-900">
                ₦{formatAmount(totalAmount)}
              </p>
            </div>

            {/* CUSTOMER CREDIT */}
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
                    onChange={(e) => setApplyCredit(e.target.checked)}
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

            {/* AMOUNT PAID */}
            <div className="px-4 py-4 sm:px-5">
              <label className={labelClass} htmlFor="sale-amount-paid">
                Amount Paid (₦)
              </label>
              <input
                id="sale-amount-paid"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
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

            {/* BALANCE */}
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

          {/* NOTES */}
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
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* SAVE */}
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
