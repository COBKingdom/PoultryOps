
"use client";

import { CreditCard, Eye, MapPin, Pencil, Phone } from "lucide-react";

import { CustomerBalance } from "@/lib/customers";
import { formatCurrency } from "@/lib/currency";

type CustomerListProps = {
  records: CustomerBalance[];
  currency?: string;
  onView?: (customer: CustomerBalance) => void;
  onEdit?: (customer: CustomerBalance) => void;
};

export default function CustomerList({
  records,
  currency = "NGN",
  onView,
  onEdit,
}: CustomerListProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <CreditCard size={22} />
        </div>

        <h3 className="mt-4 font-semibold text-slate-900">
          No customers found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Customers registered for this farm will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Customer Registry</h2>
        <p className="mt-1 text-xs text-slate-400">
          Registered customers and account balances
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Customer
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                Phone
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                State / Region
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">
                Sales
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">
                Outstanding
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {records.map((customer) => {
              const debtor = Number(customer.outstanding_balance || 0) > 0;

              return (
                <tr
                  key={customer.customer_id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {customer.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-blue-600">
                      {customer.customer_code}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="text-slate-400" />
                      {customer.phone || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {customer.location ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        {customer.location}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right font-medium text-slate-700">
                    {formatCurrency(customer.total_sales, { currency })}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span
                      className={
                        debtor
                          ? "font-bold text-red-600"
                          : "font-medium text-slate-700"
                      }
                    >
                      {formatCurrency(customer.outstanding_balance, {
                        currency,
                      })}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    {debtor ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Debtor
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Clear
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit?.(customer)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onView?.(customer)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        aria-label={`View account for ${customer.name}`}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
