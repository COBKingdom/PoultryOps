type Props = {
  records: any[];
};

export default function MortalityList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
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
              "
            >
              <div className="flex items-start justify-between">

                <div>

                  <h3 className="font-bold text-xl">
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
                  {record.quantity}
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