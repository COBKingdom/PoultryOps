"use client";

import {
  Eye,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";

import { CustomerBalance } from "@/lib/customers";
import { formatCurrency } from "@/lib/currency";

type CustomerListProps = {
  records: CustomerBalance[];
  currency?: string;
  onView?: (customer: CustomerBalance) => void;
};

export default function CustomerList({
  records,
  currency = "NGN",
  onView,
}: CustomerListProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">
          Customer Registry
        </h2>

        <p className="text-xs text-slate-400 mt-1">
          Registered customers and account balances
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Customer
              </th>

              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Phone
              </th>

              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                State / Region
              </th>

              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                Sales
              </th>

              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                Outstanding
              </th>

              <th className="text-center px-4 py-3 font-semibold text-slate-600">
                Status
              </th>

              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {records.map((customer) => {
              const debtor = customer.outstanding_balance > 0;

              return (
                <tr
                  key={customer.customer_id}
                  className="hover:bg-slate-50 transition-colors"
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
                    {formatCurrency(customer.total_sales, {
                      currency,
                    })}
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
                    <button
                      type="button"
                      onClick={() => onView?.(customer)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={15} />
                      View
                    </button>
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