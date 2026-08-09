import { Pencil } from "lucide-react";

type Props = {
  records: any[];
  onEdit: (record: any) => void;
};

export default function MortalityList({
  records,
  onEdit,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Mortality Records
        </h2>
        <p className="text-slate-500 mt-1">
          Recent mortality activity
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

                <div>
                  <h3 className="font-bold text-xl text-slate-900">
                    {
                      record.flocks
                        ?.flock_name
                    }
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {
                      record.mortality_date
                    }
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
                      px-4
                      py-2
                      rounded-2xl
                      bg-red-100
                      text-red-700
                      font-bold
                    "
                  >
                    {Number(record.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

              </div>

              <div className="mt-4">
                <p className="text-slate-600">
                  Cause:
                  {" "}
                  {record.reason}
                </p>
              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}