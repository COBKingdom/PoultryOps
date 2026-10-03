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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {/* Today */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Today
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(todayConsumed).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              kg consumed today
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        </div>
      </div>

      {/* Records */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Records
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {records.length}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Feed consumption records
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        </div>
      </div>

      {/* Total Consumed */}
      <div className="relative min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-white p-5 shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Total Consumed
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(totalConsumed).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              kg across all records
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
      </div>

    </div>
  );
}