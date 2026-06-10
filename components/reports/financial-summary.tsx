type Props = {
  report: any;
};

export default function FinancialSummary({
  report,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Financial Summary
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>
            Revenue
          </span>

          <strong>
            {report.revenue}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>
            Expenses
          </span>

          <strong>
            {report.expenses}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>
            Profit
          </span>

          <strong>
            {report.profit}
          </strong>
        </div>

      </div>

    </div>
  );
}