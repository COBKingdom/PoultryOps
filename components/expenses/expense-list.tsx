type Props = {
  records: any[];
};

export default function ExpenseList({
  records,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          Expense Records
        </h2>

        <p className="text-slate-500 mt-1">
          Recent farm expenses
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
                    {record.category}
                  </h3>

                  <p className="text-slate-500 text-sm mt-1">
                    {record.expense_date}
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
                  {Number(record.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </div>

              </div>

              {record.notes && (
                <p className="mt-4 text-slate-600">
                  {record.notes}
                </p>
              )}

            </div>
          )
        )}

      </div>

    </div>
  );
}