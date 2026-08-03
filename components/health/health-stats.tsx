type Props = {
  records: any[];
};

export default function HealthStats({
  records,
}: Props) {
  const totalRecords =
    records.length;

  const vaccinations =
    records.filter(
      (record) =>
        record.category ===
        "Vaccine"
    ).length;

  const treatments =
    records.filter(
      (record) =>
        record.category !==
        "Vaccine"
    ).length;

  const totalCost =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.cost || 0
        ),
      0
    );

  return (
    <div
      className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-4
      "
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Records
        </p>

        <h3 className="text-4xl font-bold mt-2">
          {totalRecords}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Vaccinations
        </p>

        <h3 className="text-4xl font-bold mt-2 text-green-600">
          {vaccinations}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Treatments
        </p>

        <h3 className="text-4xl font-bold mt-2 text-blue-600">
          {treatments}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Health Cost
        </p>

        <h3 className="text-4xl font-bold mt-2 text-red-600">
          {Number(totalCost).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>
    </div>
  );
}