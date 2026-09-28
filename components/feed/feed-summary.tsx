type Props = {
  records: any[];
};

export default function FeedSummary({
  records,
}: Props) {
  const totalConsumed =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.quantity_kg
        ),
      0
    );

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayConsumed =
    records
      .filter(
        (record) =>
          record.feed_date ===
          today
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(
            record.quantity_kg
          ),
        0
      );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">

        <p className="text-sm text-slate-500">
          Today
        </p>

        <h3 className="text-2xl sm:text-3xl font-bold break-words leading-tight">
          {Number(todayConsumed).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>

        <p className="text-sm text-slate-500">
          kg
        </p>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">

        <p className="text-sm text-slate-500">
          Records
        </p>

        <h3 className="text-2xl sm:text-3xl font-bold break-words leading-tight">
          {records.length}
        </h3>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">

        <p className="text-sm text-slate-500">
          Total Consumed
        </p>

        <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 break-words leading-tight">
          {Number(totalConsumed).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>

        <p className="text-sm text-slate-500">
          kg
        </p>

      </div>

    </div>
  );
}
