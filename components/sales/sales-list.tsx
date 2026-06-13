import {
  DollarSign,
  ShoppingCart,
} from "lucide-react";

type Props = {
  records: any[];
};

export default function SalesList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
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
                rounded-2xl
                border
                border-slate-200
                p-5
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex justify-between">

                <div>

                  <h3 className="font-bold text-lg">
                    {record.item_type}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {record.sale_date}
                  </p>

                </div>

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

              <div className="grid grid-cols-3 gap-4 mt-4">

                <div>

                  <p className="text-xs text-slate-500 uppercase">
                    Quantity
                  </p>

                  <p className="font-bold text-lg">
                    {record.quantity}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500 uppercase">
                    Unit Price
                  </p>

                  <p className="font-bold text-lg">
                    {record.unit_price}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500 uppercase">
                    Total
                  </p>

                  <p className="font-bold text-lg text-green-600">
                    {record.total_amount}
                  </p>

                </div>

              </div>

              {record.notes && (
                <div className="mt-4 text-sm text-slate-500">
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