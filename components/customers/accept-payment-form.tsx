"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import {
  CustomerBalance,
} from "@/lib/customers";

import {
  acceptCustomerPayment,
} from "@/lib/customer-payments";

type Props = {
  customers: CustomerBalance[];
  initialCustomer?: CustomerBalance | null;
  currency: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "POS",
  "Cheque",
  "Other",
];

function formatCurrency(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

export default function AcceptPaymentForm({
  customers,
  initialCustomer,
  currency,
  onClose,
  onSaved,
}: Props) {
  const [customerId, setCustomerId] =
    useState(
      initialCustomer?.customer_id ||
      ""
    );

  const [verified, setVerified] =
    useState(
      Boolean(initialCustomer)
    );

  const [amount, setAmount] =
    useState("");

  const [paymentDate, setPaymentDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [reference, setReference] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.customer_id ===
        customerId
    ) || null;

  useEffect(() => {
    if (initialCustomer) {
      setCustomerId(
        initialCustomer.customer_id
      );

      setVerified(true);
    }
  }, [initialCustomer]);

  function handleCustomerChange(
    value: string
  ) {
    setCustomerId(value);
    setVerified(false);
    setError(null);
    setAmount("");
  }

  function verifyCustomer() {
    if (!selectedCustomer) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (
      Number(
        selectedCustomer.outstanding_balance || 0
      ) <= 0
    ) {
      setError(
        "This customer has no outstanding balance."
      );
      return;
    }

    setVerified(true);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!selectedCustomer) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (!verified) {
      setError(
        "Please verify the customer identity before recording the payment."
      );
      return;
    }

    const paymentAmount =
      Number(amount || 0);

    const outstanding =
      Number(
        selectedCustomer.outstanding_balance || 0
      );

    if (paymentAmount <= 0) {
      setError(
        "Payment amount must be greater than zero."
      );
      return;
    }

    if (paymentAmount > outstanding) {
      setError(
        `Payment cannot exceed the outstanding balance of ${formatCurrency(
          outstanding,
          currency
        )}.`
      );
      return;
    }

    try {
      setLoading(true);

      await acceptCustomerPayment({
        customerId:
          selectedCustomer.customer_id,

        amount:
          paymentAmount,

        paymentDate,

        paymentMethod,

        reference,

        notes,
      });

      setSuccess(true);

      await onSaved();

      setTimeout(() => {
        onClose();
      }, 800);

    } catch (err) {
      console.error(
        "Failed to accept payment:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to record the payment. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>

            <div className="flex items-center gap-2">

              <CreditCard
                size={20}
                className="text-blue-600"
              />

              <h2 className="text-xl font-bold text-slate-900">
                Accept Payment
              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Record a payment against a customer account.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>

        </div>

        <div className="space-y-5 p-6">

          {/* CUSTOMER */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Customer
            </label>

            <select
              value={customerId}
              onChange={(e) =>
                handleCustomerChange(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select Customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={customer.customer_id}
                    value={customer.customer_id}
                  >
                    {customer.customer_code} —{" "}
                    {customer.name} —{" "}
                    {customer.phone}
                  </option>
                )
              )}

            </select>

          </div>

          {/* VERIFICATION */}

          {selectedCustomer && (

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">

              <div className="mb-3 flex items-center gap-2">

                <ShieldCheck
                  size={18}
                  className="text-blue-600"
                />

                <p className="text-sm font-bold text-blue-900">
                  Customer Verification
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-blue-600">
                    Customer Code
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-950">
                    {selectedCustomer.customer_code}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-600">
                    Full Name
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-950">
                    {selectedCustomer.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-600">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-950">
                    {selectedCustomer.phone}
                  </p>
                </div>

              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-blue-200 pt-4">

                <div>

                  <p className="text-xs text-blue-600">
                    Outstanding Balance
                  </p>

                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      Number(
                        selectedCustomer.outstanding_balance || 0
                      ),
                      currency
                    )}
                  </p>

                </div>

                {!verified ? (
                  <button
                    type="button"
                    onClick={verifyCustomer}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <User size={16} />
                    Verify Customer
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={17} />
                    Verified
                  </div>
                )}

              </div>

            </div>

          )}

          {/* PAYMENT DETAILS */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Date
              </label>

              <input
                type="date"
                value={paymentDate}
                onChange={(e) =>
                  setPaymentDate(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  )
                )}
              </select>

            </div>

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Payment Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              placeholder="Enter payment amount"
              disabled={!verified}
              className="w-full rounded-xl border border-slate-200 p-4 text-lg font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reference
            </label>

            <input
              value={reference}
              onChange={(e) =>
                setReference(
                  e.target.value
                )
              }
              placeholder="Receipt number, transfer reference, etc."
              disabled={!verified}
              className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              placeholder="Optional notes"
              rows={3}
              disabled={!verified}
              className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Payment recorded successfully.
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex gap-3 border-t border-slate-200 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                !verified ||
                success
              }
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Recording..."
                : "Record Payment"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}