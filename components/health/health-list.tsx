import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
  currency?: string;
};

function formatNumber(value: any) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not recorded";
  }

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function HealthList({
  records,
  onEdit,
  currency,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Health Records
        </h2>

        <p className="text-slate-500 mt-1">
          Vaccinations, treatments and flock health activities
        </p>
      </div>

      <div className="space-y-4">
        {records.map((record) => {
          const totalPrice =
            record.total_price !== null &&
            record.total_price !== undefined
              ? record.total_price
              : record.cost;

          const hasQuantity =
            record.quantity !== null &&
            record.quantity !== undefined &&
            record.quantity !== "";

          const hasUnitPrice =
            record.unit_price !== null &&
            record.unit_price !== undefined &&
            record.unit_price !== "";

          return (
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
                    {record.treatment_name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {record.category}
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
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {/* Flock */}
                <div>
                  <p className="text-slate-500">
                    Flock
                  </p>

                  <p className="font-medium">
                    {record.flocks?.flock_name ||
                      "Not recorded"}
                  </p>
                </div>

                {/* Quantity */}
                <div>
                  <p className="text-slate-500">
                    Quantity
                  </p>

                  <p className="font-medium">
                    {hasQuantity
                      ? `${formatNumber(record.quantity)} ${
                          record.quantity_unit || ""
                        }`
                      : "Not recorded"}
                  </p>
                </div>

                {/* Unit Price */}
                <div>
                  <p className="text-slate-500">
                    Unit Price
                  </p>

                  <p className="font-medium">
                    {hasUnitPrice
                      ? formatCurrency(
                          record.unit_price,
                          { currency }
                        )
                      : "Not recorded"}
                  </p>
                </div>

                {/* Total Price */}
                <div>
                  <p className="text-slate-500">
                    Total Price
                  </p>

                  <p className="font-bold text-red-600">
                    {formatCurrency(
                      totalPrice ?? 0,
                      { currency }
                    )}
                  </p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-slate-500">
                    Date
                  </p>

                  <p className="font-medium">
                    {record.health_date}
                  </p>
                </div>
              </div>

              {record.notes && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm text-slate-600">
                    {record.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}