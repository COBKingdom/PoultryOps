import { formatCurrency } from "@/lib/currency";

type Props = {
  report: any;
  currency?: string;
};

export default function FinancialSummary({
  report,
  currency,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Financial Summary
      </h2>

      <div className="space-y-5">

        <div className="flex justify-between">

          <span className="text-slate-500">
            Revenue
          </span>

          <span className="font-bold text-green-600">
            {formatCurrency(report.revenue, { currency })}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-500">
            Expenses
          </span>

          <span className="font-bold text-red-600">
            {formatCurrency(report.expenses, { currency })}
          </span>

        </div>

        <div className="border-t pt-4 flex justify-between">

          <span className="font-semibold">
            Net Profit
          </span>

          <span
            className={`font-bold text-xl ${
              report.profit >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(report.profit, { currency })}
          </span>

        </div>

      </div>

    </div>
  );
}