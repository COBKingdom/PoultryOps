
import { Pencil, ShoppingCart, UserRound } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
  currency?: string;
};

function getUnitOfSale(record: any): string {
  if (record.unit_of_sale) {
    return String(record.unit_of_sale);
  }

  const itemType = String(record.item_type || "");

  if (itemType === "Egg Sales") return "Crates";

  if (
    [
      "Live Bird Sales",
      "Spent Layer Sales",
      "Broiler Sales",
      "Cockerel Sales",
    ].includes(itemType)
  ) {
    return "Birds";
  }

  if (["Manure Sales", "Feed Sales"].includes(itemType)) {
    return "Bags";
  }

  if (itemType === "Equipment Sales") return "Pieces";

  return "Units";
}

function formatQuantity(quantity: unknown): string {
  const value = Number(quantity || 0);

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getTimestamp(value: unknown): number {
  if (!value) return 0;

  const timestamp = new Date(String(value)).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortSalesNewestFirst(records: any[]): any[] {
  return [...records].sort((a, b) => {
    // Prefer the actual creation timestamp when available.
    // This correctly orders transactions recorded on the same day.
    const createdDifference =
      getTimestamp(b.created_at) - getTimestamp(a.created_at);

    if (createdDifference !== 0) {
      return createdDifference;
    }

    // Fall back to the sale date when creation timestamps are unavailable
    // or identical.
    const saleDateDifference =
      getTimestamp(b.sale_date) - getTimestamp(a.sale_date);

    if (saleDateDifference !== 0) {
      return saleDateDifference;
    }

    return 0;
  });
}

export default function SalesList({
  records,
  onEdit,
  currency,
}: Props) {
  const sortedRecords = sortSalesNewestFirst(records);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Sales Records
        </h2>
        <p className="mt-1 text-slate-500">
          Recent sales activity — newest first
        </p>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
          <ShoppingCart
            className="mx-auto mb-3 text-slate-400"
            size={28}
          />
          <p className="font-semibold text-slate-700">
            No sales records found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Sales matching your selected filters will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecords.map((record) => {
            const unit = getUnitOfSale(record);

            const customerName =
              record.customer?.name ||
              record.customer_name ||
              record.buyer_name ||
              null;

            const customerCode =
              record.customer?.customer_code ||
              record.customer_code ||
              null;

            return (
              <div
                key={record.id}
                className="rounded-3xl border border-slate-200 p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {record.item_type || "Sale"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {record.sale_date || "Date unavailable"}
                    </p>

                    {record.sale_category && (
                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {record.sale_category}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      aria-label={`Edit ${record.item_type || "sale"}`}
                    >
                      <Pencil size={16} />
                      <span>Edit</span>
                    </button>

                    <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-green-100 sm:flex">
                      <ShoppingCart
                        className="text-green-600"
                        size={22}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Quantity
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatQuantity(record.quantity)}{" "}
                      {unit.toLowerCase()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Price per {unit.toLowerCase()}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(record.unit_price, { currency })}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                      Total
                    </p>
                    <p className="mt-1 text-lg font-bold text-green-700">
                      {formatCurrency(record.total_amount, { currency })}
                    </p>
                  </div>
                </div>

                {customerName || customerCode ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700">
                      <UserRound size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </p>

                      {customerName && (
                        <p className="mt-1 break-words text-sm font-bold text-slate-900">
                          {customerName}
                        </p>
                      )}

                      {customerCode && (
                        <p className="mt-0.5 text-xs font-semibold text-blue-700">
                          {customerCode}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Cash sale / no customer linked
                  </div>
                )}

                {record.notes && (
                  <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    {record.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
