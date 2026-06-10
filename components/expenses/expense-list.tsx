type Props = {
  records: any[];
};

export default function ExpenseList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Expense Records
      </h2>

      <div className="space-y-3">

        {records.map(
          (record) => (
            <div
              key={record.id}
              className="border rounded p-3"
            >
              <div className="font-semibold">
                {record.category}
              </div>

              <div>
                Amount: {record.amount}
              </div>

              <div>
                {record.notes}
              </div>

              <div>
                {record.expense_date}
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}