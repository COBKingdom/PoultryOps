type Props = {
  records: any[];
};

export default function HealthList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          Health Records
        </h2>

        <p className="text-slate-500 mt-1">
          Vaccinations, treatments and flock health activities
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
                rounded-2xl
                p-5
              "
            >
              <div className="flex items-start justify-between">

                <div>

                  <h3 className="font-bold text-lg">
                    {record.treatment_name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {record.category}
                  </p>

                </div>

                <div className="text-right">

                  <p className="font-bold text-red-600">
                    {record.cost}
                  </p>

                </div>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">

                <div>

                  <p className="text-slate-500">
                    Flock
                  </p>

                  <p className="font-medium">
                    {
                      record.flocks
                        ?.flock_name
                    }
                  </p>

                </div>

                <div>

                  <p className="text-slate-500">
                    Date
                  </p>

                  <p className="font-medium">
                    {
                      record.health_date
                    }
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
          )
        )}

      </div>

    </div>
  );
}