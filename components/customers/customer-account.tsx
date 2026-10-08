"use client";

import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Phone,
  MapPin,
  User,
} from "lucide-react";

import {
  CustomerBalance,
  CustomerSaleBalance,
} from "@/lib/customers";

import {
  CustomerPayment,
} from "@/lib/customer-payments";

type Props = {
  customer: CustomerBalance;
  sales: CustomerSaleBalance[];
  payments: CustomerPayment[];
  currency: string;
  onBack: () => void;
  onAcceptPayment: () => void;
};

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

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString();
}

export default function CustomerAccount({
  customer,
  sales,
  payments,
  currency,
  onBack,
  onAcceptPayment,
}: Props) {
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

            <div className="flex items-center gap-3">

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

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <User size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Customer
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {customer.name}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Phone size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Phone
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {customer.phone || "—"}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <MapPin size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Location
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {customer.location || "—"}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <FileText size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Address
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {customer.address || "—"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-slate-500">
            Total Sales
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(
              Number(customer.total_sales || 0),
              currency
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Customer purchases
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-slate-500">
            Total Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(
              Number(customer.total_paid || 0),
              currency
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Payments received
          </p>

        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">

          <p className="text-sm font-medium text-red-700">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold text-red-700">
            {formatCurrency(
              Number(customer.outstanding_balance || 0),
              currency
            )}
          </p>

          <p className="mt-1 text-xs text-red-600">
            Current receivable
          </p>

        </div>

      </div>

      {/* SALES HISTORY */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale Amount
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Outstanding
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {sales.map(
                  (sale) => (
                    <tr
                      key={sale.sale_id}
                    >

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          sale.sale_date
                        )}
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
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* PAYMENT HISTORY */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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

            <table className="w-full min-w-[700px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reference
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {payments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                    >

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={15} />
                          {formatDate(
                            payment.payment_date
                          )}
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

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}