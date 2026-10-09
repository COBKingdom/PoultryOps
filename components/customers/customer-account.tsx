
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import {
  CustomerBalance,
  CustomerSaleBalance,
} from "@/lib/customers";

import {
  CustomerPayment,
  correctCustomerPayment,
} from "@/lib/customer-payments";

type Props = {
  customer: CustomerBalance;
  sales: CustomerSaleBalance[];
  payments: CustomerPayment[];
  currency: string;
  onBack: () => void;
  onAcceptPayment: () => void;
  onPaymentCorrected: () => Promise<void> | void;
};

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString()}`;
  }
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(
    `${value.slice(0, 10)}T00:00:00`
  ).toLocaleDateString();
}

export default function CustomerAccount({
  customer,
  sales,
  payments,
  currency,
  onBack,
  onAcceptPayment,
  onPaymentCorrected,
}: Props) {
  const [editingPayment, setEditingPayment] =
    useState<CustomerPayment | null>(null);

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [savingCorrection, setSavingCorrection] =
    useState(false);
  const [correctionError, setCorrectionError] =
    useState("");

  function openEditPayment(payment: CustomerPayment) {
    setEditingPayment(payment);
    setAmount(String(payment.amount ?? ""));
    setPaymentDate(
      payment.payment_date?.slice(0, 10) || ""
    );
    setPaymentMethod(payment.payment_method || "Cash");
    setReference(payment.reference || "");
    setNotes(payment.notes || "");
    setCorrectionError("");
  }

  async function savePaymentCorrection(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingPayment) return;

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setCorrectionError(
        "Enter a payment amount greater than zero."
      );
      return;
    }

    if (!paymentDate || !paymentMethod.trim()) {
      setCorrectionError(
        "Payment date and method are required."
      );
      return;
    }

    setSavingCorrection(true);
    setCorrectionError("");

    try {
      await correctCustomerPayment({
        paymentId: editingPayment.id,
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        reference,
        notes,
      });

      setEditingPayment(null);

      await onPaymentCorrected();
    } catch (error) {
      setCorrectionError(
        error instanceof Error
          ? error.message
          : "Unable to correct this payment."
      );
    } finally {
      setSavingCorrection(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {customer.name}
              </h2>

              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {customer.customer_code}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Customer Account
            </p>
          </div>
        </div>

        {Number(customer.outstanding_balance || 0) > 0 && (
          <button
            type="button"
            onClick={onAcceptPayment}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <CreditCard size={18} />
            Accept Payment
          </button>
        )}
      </div>

      {/* CUSTOMER INFORMATION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={<User size={18} />}
            label="Customer"
            value={customer.name}
          />

          <InfoItem
            icon={<Phone size={18} />}
            label="Phone"
            value={customer.phone || "—"}
          />

          <InfoItem
            icon={<MapPin size={18} />}
            label="Location"
            value={customer.location || "—"}
          />

          <InfoItem
            icon={<FileText size={18} />}
            label="Address"
            value={customer.address || "—"}
          />
        </div>
      </div>

      {/* ACCOUNT SUMMARY */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          label="Total Sales"
          value={formatCurrency(
            Number(customer.total_sales || 0),
            currency
          )}
          sublabel="Customer purchases"
        />

        <Kpi
          label="Total Paid"
          value={formatCurrency(
            Number(customer.total_paid || 0),
            currency
          )}
          sublabel="Payments received"
          green
        />

        <Kpi
          label="Outstanding"
          value={formatCurrency(
            Number(customer.outstanding_balance || 0),
            currency
          )}
          sublabel="Current receivable"
          red
        />
      </div>

      {/* SALES HISTORY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Sales History
          </h3>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No customer sales recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Sale</Th>
                  <Th right>Quantity</Th>
                  <Th right>Sale Amount</Th>
                  <Th right>Paid</Th>
                  <Th right>Outstanding</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.sale_id}>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(sale.sale_date)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {sale.item_type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sale.sale_category}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-slate-700">
                      {sale.quantity}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(
                        Number(sale.total_amount || 0),
                        currency
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-emerald-700">
                      {formatCurrency(
                        Number(sale.amount_paid || 0),
                        currency
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-red-600">
                      {formatCurrency(
                        Number(sale.outstanding_amount || 0),
                        currency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PAYMENT HISTORY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Payment History
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No payments recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th>Reference</Th>
                  <Th right>Amount</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        {formatDate(payment.payment_date)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {payment.payment_method}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {payment.reference || "—"}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">
                      {formatCurrency(
                        Number(payment.amount || 0),
                        currency
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openEditPayment(payment)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CORRECT PAYMENT MODAL */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-payment-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3
              id="edit-payment-title"
              className="text-xl font-bold text-slate-900"
            >
              Correct Payment Record
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Correcting this record recalculates how the payment is allocated to outstanding sales.
            </p>

            <form
              onSubmit={savePaymentCorrection}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="correction-amount"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Payment Amount ({currency})
                </label>

                <input
                  id="correction-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="correction-date"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Payment Date
                  </label>

                  <input
                    id="correction-date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(event) =>
                      setPaymentDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="correction-method"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Payment Method
                  </label>

                  <select
                    id="correction-method"
                    required
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  >
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>POS</option>
                    <option>Mobile Money</option>
                    <option>Cheque</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="correction-reference"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Reference (optional)
                </label>

                <input
                  id="correction-reference"
                  value={reference}
                  onChange={(event) =>
                    setReference(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </div>

              <div>
                <label
                  htmlFor="correction-notes"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Notes (optional)
                </label>

                <textarea
                  id="correction-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </div>

              {correctionError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {correctionError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={savingCorrection}
                  onClick={() => setEditingPayment(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCorrection}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCorrection
                    ? "Saving correction..."
                    : "Save Correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sublabel,
  green,
  red,
}: {
  label: string;
  value: string;
  sublabel: string;
  green?: boolean;
  red?: boolean;
}) {
  const tone = red
    ? "border-red-200 bg-red-50"
    : "border-slate-200 bg-white";

  const labelTone = red
    ? "text-red-700"
    : "text-slate-500";

  const valueTone = red
    ? "text-red-700"
    : green
      ? "text-emerald-600"
      : "text-slate-900";

  const subTone = red
    ? "text-red-600"
    : "text-slate-500";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
      <p className={`text-sm font-medium ${labelTone}`}>
        {label}
      </p>

      <p className={`mt-2 text-2xl font-bold ${valueTone}`}>
        {value}
      </p>

      <p className={`mt-1 text-xs ${subTone}`}>
        {sublabel}
      </p>
    </div>
  );
}

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
