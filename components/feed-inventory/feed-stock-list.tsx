import {
  CalendarDays,
  Package,
  Pencil,
  Truck,
  User,
} from "lucide-react";

import {
  getFeedPurchaseDetails,
} from "@/lib/feedInventory";

type Props = {
  records: any[];
  onEdit: (
    record: any
  ) => void;
};

function formatNumber(
  value: number
) {
  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function formatCurrency(
  value: number
) {
  return `₦${value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value: string
) {
  if (!value) return "";

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export default function FeedStockList({
  records,
  onEdit,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-slate-900">
          Feed Stock Records
        </h2>

        <p className="text-slate-500 mt-1">
          Feed purchases recorded for the selected period.
        </p>

      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">

          <Package
            size={36}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-4 font-semibold text-slate-800">
            No feed purchases found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try another date range or record a new feed purchase.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {records.map(
            (record) => {
              const details =
                getFeedPurchaseDetails(
                  record
                );

              const recordedBy =
                record?.profiles
                  ?.full_name ||
                record?.profiles
                  ?.email ||
                record?.created_by ||
                "Not recorded";

              return (
                <div
                  key={
                    record.id
                  }
                  className="rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">

                        <Package
                          size={23}
                          className="text-blue-600"
                        />

                      </div>

                      <div>

                        <h3 className="font-bold text-lg text-slate-900">
                          {record.feed_type ||
                            "Feed"}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">

                          <CalendarDays
                            size={14}
                          />

                          {formatDate(
                            record.purchase_date
                          )}

                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          record
                        )
                      }
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 flex items-center gap-2 flex-shrink-0"
                    >

                      <Pencil
                        size={16}
                      />

                      Edit

                    </button>

                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Quantity
                      </p>

                      <p className="text-xl font-bold text-slate-900 mt-1">
                        {formatNumber(
                          details.quantityBags
                        )}{" "}
                        {details.quantityBags ===
                        1
                          ? "bag"
                          : "bags"}
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        {formatNumber(
                          details.quantityKg
                        )}{" "}
                        kg
                      </p>

                    </div>

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Price per Bag
                      </p>

                      <p className="text-xl font-bold text-slate-900 mt-1">
                        {formatCurrency(
                          details.bagPrice
                        )}
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        {formatNumber(
                          details.bagWeightKg
                        )}{" "}
                        kg per bag
                      </p>

                    </div>

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Total Purchase
                      </p>

                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {formatCurrency(
                          details.totalPrice
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        <Truck
                          size={14}
                        />

                        Supplier
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        {record.supplier ||
                          "Not provided"}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        <User
                          size={14}
                        />

                        Recorded By
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        {recordedBy}
                      </p>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}