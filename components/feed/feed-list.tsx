import { Pencil } from "lucide-react";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
};

export default function FeedList({
  records,
  onEdit,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Feed Records
        </h2>

        <p className="text-slate-500 mt-1">
          Recent feeding activity
        </p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

          <p className="text-lg font-semibold text-slate-700">
            No feed records found
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Try changing the flock, date range, or search.
          </p>

        </div>
      ) : (
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

                {/* Header */}
                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <h3 className="font-bold text-lg text-slate-900 truncate">
                      {record.flocks?.flock_name ||
                        "Unknown Flock"}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {record.feed_date}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      onEdit(record)
                    }
                    className="
                      shrink-0
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

                {/* Feed Details */}
                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Feed Type
                    </p>

                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {record.feed_type}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Quantity
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {Number(
                        record.quantity_kg
                      ).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      kg
                    </p>
                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}