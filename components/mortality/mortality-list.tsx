type Props = {
  records: any[];
};

export default function MortalityList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Mortality Records
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
                Qty: {
                  record.quantity
                }
              </div>

              <div>
                Reason: {
                  record.reason
                }
              </div>

              <div>
                {
                  record.mortality_date
                }
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}