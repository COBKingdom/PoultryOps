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

type SaleCategory =
  | "Bird Sales"
  | "Egg Sales"
  | "Other Sales";

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

const EGG_SALE_TYPES = [
  "Egg Sales",
];

const OTHER_SALE_TYPES = [
  "Manure Sales",
  "Feed Sales",
  "Equipment Sales",
  "Other Income",
];

export default function AddSaleForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [saleCategory, setSaleCategory] =
    useState<SaleCategory>("Egg Sales");

  const [itemType, setItemType] =
    useState("Egg Sales");

  const [flockId, setFlockId] =
    useState("");

  const [customerId, setCustomerId] =
    useState("");

  const [customers, setCustomers] =
    useState<CustomerBalance[]>([]);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [quantity, setQuantity] =
    useState("");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [amountPaid, setAmountPaid] =
    useState("");

  const [applyCredit, setApplyCredit] =
    useState(true);

  const [notes, setNotes] =
    useState("");

  const [recordDate, setRecordDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  /*
   * Load customers for the current farm.
   */
  useEffect(() => {
    async function loadCustomers() {
      try {
        setCustomersLoading(true);

        const result =
          await getCustomers(farmId);

        setCustomers(result);
      } catch (error) {
        console.error(
          "Failed to load customers:",
          error
        );
      } finally {
        setCustomersLoading(false);
      }
    }

    if (farmId) {
      loadCustomers();
    }
  }, [farmId]);

  /*
   * Keep item type aligned with sale category.
   */
  useEffect(() => {
    if (saleCategory === "Bird Sales") {
      setItemType(
        BIRD_SALE_TYPES[0]
      );
      return;
    }

    if (saleCategory === "Egg Sales") {
      setItemType(
        EGG_SALE_TYPES[0]
      );
      return;
    }

    setItemType(
      OTHER_SALE_TYPES[0]
    );
  }, [saleCategory]);

  /*
   * Bird sales require a flock.
   *
   * Egg sales may optionally be associated
   * with a flock.
   *
   * Other sales do not use a flock.
   */
  const requiresFlock =
    saleCategory === "Bird Sales";

  const allowsFlock =
    saleCategory === "Bird Sales" ||
    saleCategory === "Egg Sales";

  function handleCategoryChange(
    category: SaleCategory
  ) {
    setSaleCategory(category);

    if (category === "Other Sales") {
      setFlockId("");
    }
  }

  /*
   * Selected customer.
   */
  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (customer) =>
            customer.customer_id ===
            customerId
        ) || null,
      [
        customers,
        customerId,
      ]
    );

  /*
   * Calculate sale amount.
   */
  const totalAmount =
    Number(quantity || 0) *
    Number(unitPrice || 0);

  /*
   * Available customer credit.
   */
  const availableCredit =
    selectedCustomer
      ? Number(
          selectedCustomer.credit_balance ||
            0
        )
      : 0;

  /*
   * Credit applied to this sale.
   */
  const creditApplied =
    customerId &&
    applyCredit
      ? Math.min(
          availableCredit,
          totalAmount
        )
      : 0;

  /*
   * Amount still required after
   * applying existing customer credit.
   */
  const remainingAfterCredit =
    Math.max(
      totalAmount -
        creditApplied,
      0
    );

  /*
   * Amount paid directly with this sale.
   */
  const enteredAmountPaid =
    Number(amountPaid || 0);

  /*
   * Prevent the UI from displaying
   * a negative balance.
   */
  const effectiveAmountPaid =
    Math.min(
      enteredAmountPaid,
      remainingAfterCredit
    );

  /*
   * Final outstanding balance.
   */
  const balance =
    Math.max(
      remainingAfterCredit -
        effectiveAmountPaid,
      0
    );

  /*
   * Customer has no credit when not selected.
   */
  const isCustomerSale =
    Boolean(customerId);

  /*
   * Validate amount paid against
   * remaining balance.
   */
  const paymentExceedsRemaining =
    enteredAmountPaid >
    remainingAfterCredit;

  async function handleSave() {
    if (
      requiresFlock &&
      !flockId
    ) {
      alert(
        "Please select a flock for this bird sale."
      );
      return;
    }

    if (
      !quantity ||
      Number(quantity) <= 0
    ) {
      alert(
        "Please enter a valid quantity."
      );
      return;
    }

    if (
      !unitPrice ||
      Number(unitPrice) < 0
    ) {
      alert(
        "Please enter a valid unit price."
      );
      return;
    }

    if (
      paymentExceedsRemaining
    ) {
      alert(
        "Amount paid cannot exceed the remaining balance after customer credit."
      );
      return;
    }

    if (
      totalAmount <= 0
    ) {
      alert(
        "The sale amount must be greater than zero."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Customer sales use the new transaction
       * function so the sale and payment/
       * credit allocation are handled together.
       *
       * Cash / non-customer sales continue
       * through the existing createSale path.
       */
      if (isCustomerSale) {
        const {
          data,
          error,
        } = await supabase.rpc(
          "record_customer_sale",
          {
            p_farm_id: farmId,
            p_customer_id:
              customerId,
            p_flock_id:
              allowsFlock &&
              flockId
                ? flockId
                : null,
            p_sale_category:
              saleCategory,
            p_sale_date:
              recordDate,
            p_item_type:
              itemType,
            p_quantity:
              Number(quantity),
            p_unit_price:
              Number(unitPrice),
            p_total_amount:
              totalAmount,
            p_amount_paid:
              effectiveAmountPaid,
            p_apply_credit:
              applyCredit,
            p_notes:
              notes,
          }
        );

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "The sale could not be created."
          );
        }
      } else {
        /*
         * Preserve the existing cash-sale
         * behaviour.
         */
        const { createSale } =
          await import(
            "@/lib/sales"
          );

        await createSale({
          farm_id: farmId,
          flock_id:
            allowsFlock &&
            flockId
              ? flockId
              : null,
          customer_id: null,
          sale_category:
            saleCategory,
          sale_date:
            recordDate,
          item_type:
            itemType,
          quantity:
            Number(quantity),
          unit_price:
            Number(unitPrice),
          total_amount:
            totalAmount,
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
      console.error(
        "Failed to save sale:",
        error
      );

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

  function formatAmount(
    amount: number
  ) {
    return new Intl.NumberFormat(
      "en-NG",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Record Sale
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Record a sale, payment and customer
          balance in one transaction.
        </p>
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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Sale Date
          </label>

          <input
            type="date"
            value={recordDate}
            onChange={(e) =>
              setRecordDate(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>


        {/* SALE CATEGORY */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Sale Category
          </label>

          <select
            value={saleCategory}
            onChange={(e) =>
              handleCategoryChange(
                e.target.value as SaleCategory
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="Bird Sales">
              Bird Sales
            </option>

            <option value="Egg Sales">
              Egg Sales
            </option>

            <option value="Other Sales">
              Other Sales
            </option>
          </select>
        </div>


        {/* CUSTOMER */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Customer
          </label>

          <select
            value={customerId}
            onChange={(e) =>
              setCustomerId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              {customersLoading
                ? "Loading Customers..."
                : "No Customer / Cash Sale"}
            </option>

            {customers.map(
              (customer) => (
                <option
                  key={
                    customer.customer_id
                  }
                  value={
                    customer.customer_id
                  }
                >
                  {
                    customer.customer_code
                  }{" "}
                  —{" "}
                  {customer.name}
                  {customer.phone
                    ? ` — ${customer.phone}`
                    : ""}
                </option>
              )
            )}
          </select>

          {selectedCustomer && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Outstanding:{" "}
                  <strong>
                    ₦
                    {formatAmount(
                      Number(
                        selectedCustomer.outstanding_balance ||
                          0
                      )
                    )}
                  </strong>
                </span>

                <span>
                  Credit:{" "}
                  <strong>
                    ₦
                    {formatAmount(
                      availableCredit
                    )}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>


        {/* FLOCK */}

        {allowsFlock && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Flock
              {!requiresFlock && (
                <span className="ml-1 text-xs font-normal text-slate-400">
                  Optional
                </span>
              )}
            </label>

            <select
              value={flockId}
              onChange={(e) =>
                setFlockId(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required={requiresFlock}
            >
              <option value="">
                {requiresFlock
                  ? "Select Flock"
                  : "No Flock / Not Applicable"}
              </option>

              {flocks.map(
                (flock: any) => (
                  <option
                    key={flock.id}
                    value={flock.id}
                  >
                    {
                      flock.flock_name
                    }
                  </option>
                )
              )}
            </select>
          </div>
        )}


        {/* SALE TYPE */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Item
          </label>

          <select
            value={itemType}
            onChange={(e) =>
              setItemType(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          >
            {saleTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        </div>


        {/* QUANTITY + UNIT PRICE */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Quantity
            </label>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Unit Price
            </label>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

        </div>


        {/* FINANCIAL SUMMARY */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">
              Total Amount
            </span>

            <span className="text-lg font-bold text-slate-900">
              ₦
              {formatAmount(
                totalAmount
              )}
            </span>
          </div>


          {/* CUSTOMER CREDIT */}

          {isCustomerSale &&
            availableCredit > 0 && (
              <div className="border-t border-slate-200 pt-3">

                <label className="flex cursor-pointer items-center justify-between gap-3">

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Apply Customer Credit
                    </p>

                    <p className="text-xs text-slate-500">
                      Available credit: ₦
                      {formatAmount(
                        availableCredit
                      )}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={applyCredit}
                    onChange={(e) =>
                      setApplyCredit(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                </label>

                {applyCredit && (
                  <div className="mt-2 text-right text-sm font-semibold text-green-700">
                    Credit applied: ₦
                    {formatAmount(
                      creditApplied
                    )}
                  </div>
                )}

              </div>
            )}


          {/* AMOUNT PAID */}

          <div className="mt-3 border-t border-slate-200 pt-3">

            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount Paid
            </label>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={amountPaid}
              onChange={(e) =>
                setAmountPaid(
                  e.target.value
                )
              }
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                paymentExceedsRemaining
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />

            {paymentExceedsRemaining && (
              <p className="mt-1.5 text-xs text-red-600">
                Maximum additional payment:
                {" "}
                ₦
                {formatAmount(
                  remainingAfterCredit
                )}
              </p>
            )}

          </div>


          {/* BALANCE */}

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">

            <span className="text-sm font-semibold text-slate-700">
              Balance
            </span>

            <span
              className={`text-xl font-bold ${
                balance > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              ₦
              {formatAmount(
                balance
              )}
            </span>

          </div>

        </div>


        {/* NOTES */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes
          </label>

          <input
            placeholder="Optional notes"
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>


        {/* SAVE */}

        <SaveButton
          loading={loading}
          success={success}
          label="Save Sale"
        />

      </form>

    </div>
  );
}