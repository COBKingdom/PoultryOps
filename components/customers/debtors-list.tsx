"use client";

import { Eye, CreditCard } from "lucide-react";

import {
  CustomerBalance,
} from "@/lib/customers";

type Props = {
  records: CustomerBalance[];
  currency: string;
  onViewAccount: (
    customer: CustomerBalance
  ) => void;
  onAcceptPayment: (
    customer: CustomerBalance
  ) => void;
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

export default function DebtorsList({
  records,
  currency,
  onViewAccount,
  onAcceptPayment,
}: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          ✓
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          No Outstanding Debts
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          All customer accounts are currently settled.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[800px]">

          <thead className="border-b border-slate-200 bg-slate-50">

            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Sales
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Paid
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outstanding
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {records.map(
              (customer) => (
                <tr
                  key={customer.customer_id}
                  className="hover:bg-slate-50"
                >

                  <td className="px-5 py-4">

                    <div className="font-semibold text-slate-900">
                      {customer.name}
                    </div>

                    <div className="mt-0.5 text-xs font-medium text-blue-600">
                      {customer.customer_code}
                    </div>

                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {customer.phone || "—"}
                  </td>

                  <td className="px-5 py-4 text-right text-sm text-slate-700">
                    {formatCurrency(
                      Number(
                        customer.total_sales || 0
                      ),
                      currency
                    )}
                  </td>

                  <td className="px-5 py-4 text-right text-sm text-emerald-700">
                    {formatCurrency(
                      Number(
                        customer.total_paid || 0
                      ),
                      currency
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">

                    <span className="font-bold text-red-600">
                      {formatCurrency(
                        Number(
                          customer.outstanding_balance || 0
                        ),
                        currency
                      )}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          onViewAccount(
                            customer
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye size={15} />
                        Account
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onAcceptPayment(
                            customer
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <CreditCard size={15} />
                        Accept Payment
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}