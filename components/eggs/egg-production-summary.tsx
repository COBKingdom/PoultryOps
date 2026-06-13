type Props = {
  records: any[];
};

export default function EggProductionSummary({
  records,
}: Props) {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todayEggs =
    records
      .filter(
        (record) =>
          record.production_date ===
          today
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(
            record.egg_count
          ),
        0
      );

  const totalEggs =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.egg_count
        ),
      0
    );

  const crackedEggs =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.cracked_eggs || 0
        ),
      0
    );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Today
        </p>

        <h3 className="text-3xl font-bold">
          {todayEggs}
        </h3>

        <p className="text-sm text-slate-500">
          Eggs
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Records
        </p>

        <h3 className="text-3xl font-bold">
          {records.length}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Total Eggs
        </p>

        <h3 className="text-3xl font-bold text-blue-600">
          {totalEggs}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Cracked Eggs
        </p>

        <h3 className="text-3xl font-bold text-amber-600">
          {crackedEggs}
        </h3>
      </div>

    </div>
  );
}