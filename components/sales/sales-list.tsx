import { Pencil, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
  currency?: string;
};

export default function SalesList({
  records,
  onEdit,
  currency,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Sales Records
        </h2>
        <p className="text-slate-500 mt-1">
          Recent sales activity
        </p>
      </div>

      <div className="space-y-4">

        {records.map(
          (record) => (
            <div
              key={record.id}
              className="
                border
                border-slate-200
                rounded-3xl
                p-5
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex items-start justify-between">

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">
                    {record.item_type}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {record.sale_date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEdit(record)}
                    className="
                      rounded-xl
                      border
                      border-blue-200
                      bg-blue-50
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-blue-700
                      transition
                      hover:bg-blue-100
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <div
                    className="
                      w-12
                      h-12
                      rounded-2xl
                      bg-green-100
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <ShoppingCart
                      className="text-green-600"
                      size={22}
                    />
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">

                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Quantity
                  </p>
                  <p className="font-bold text-lg">
                    {Number(record.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Unit Price
                  </p>
                  <p className="font-bold text-lg">
                    {formatCurrency(record.unit_price, { currency })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Total
                  </p>
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(record.total_amount, { currency })}
                  </p>
                </div>

              </div>

              {record.notes && (
                <div className="mt-4 text-sm text-slate-600">
                  {record.notes}
                </div>
              )}
            </div>
          )
        )}

      </div>

    </div>
  );
}