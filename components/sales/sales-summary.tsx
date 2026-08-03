type Props = {
  records: any[];
};

export default function SalesSummary({
  records,
}: Props) {
  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const todaySales =
    records
      .filter(
        (record) =>
          record.sale_date ===
          today
      )
      .reduce(
        (sum, record) =>
          sum +
          Number(
            record.total_amount
          ),
        0
      );

  const totalRevenue =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.total_amount
        ),
      0
    );

  const totalQuantity =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.quantity
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
          {Number(todaySales).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Revenue
        </p>

        <h3 className="text-3xl font-bold text-green-600">
          {Number(totalRevenue).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Transactions
        </p>

        <h3 className="text-3xl font-bold">
          {records.length}
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Quantity Sold
        </p>

        <h3 className="text-3xl font-bold text-blue-600">
          {Number(totalQuantity).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

    </div>
  );
}