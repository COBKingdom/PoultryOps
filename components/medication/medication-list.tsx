type Props = {
  records: any[];
};

export default function MedicationList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Medication Records
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
                  record.medication_name
                }
              </div>

              <div>
                Category:
                {" "}
                {
                  record.category
                }
              </div>

              <div>
                Cost:
                {" "}
                {record.cost}
              </div>

              <div>
                Flock:
                {" "}
                {
                  record.flocks
                    ?.flock_name
                }
              </div>

              <div>
                {
                  record.medication_date
                }
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}