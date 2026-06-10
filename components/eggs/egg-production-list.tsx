type Props = {
  records: any[];
};

export default function EggProductionList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Egg Production Records
      </h2>

      <div className="space-y-3">

        {records.map(
          (record) => (
            <div
              key={record.id}
              className="border rounded p-3"
            >
              <div className="font-semibold">
                {
                  record.flocks
                    ?.flock_name
                }
              </div>

              <div>
                Eggs: {
                  record.egg_count
                }
              </div>

              <div>
                {
                  record.production_date
                }
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}