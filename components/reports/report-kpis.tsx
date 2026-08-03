import {
  TrendingUp,
  ReceiptText,
  Wallet,
  AlertTriangle,
} from "lucide-react";

type Props = {
  report: any;
};

export default function ReportKpis({
  report,
}: Props) {
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

        <div className="flex items-center justify-between">

          <div>

            <p className="text-slate-500 text-sm">
              Revenue
            </p>

            <h3 className="text-4xl font-bold text-green-600 mt-2">
              {Number(report.revenue).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>

          </div>

          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">

            <TrendingUp
              size={24}
              className="text-green-600"
            />

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-slate-500 text-sm">
              Expenses
            </p>

            <h3 className="text-4xl font-bold text-red-600 mt-2">
              {Number(report.expenses).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>

          </div>

          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">

            <ReceiptText
              size={24}
              className="text-red-600"
            />

          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-slate-500 text-sm">
              Profit
            </p>

            <h3
              className={`text-4xl font-bold mt-2 ${
                report.profit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {Number(report.profit).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>

          </div>

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              report.profit >= 0
                ? "bg-green-100"
                : "bg-red-100"
            }`}
          >
            <Wallet
              size={24}
              className={
                report.profit >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            />
          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-slate-500 text-sm">
              Mortality
            </p>

            <h3 className="text-4xl font-bold text-amber-600 mt-2">
              {Number(report.mortality).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>

          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">

            <AlertTriangle
              size={24}
              className="text-amber-600"
            />

          </div>

        </div>

      </div>

    </div>
  );
}