import { formatCurrency } from "@/lib/currency";

type Props = {
  report: any;
  currency?: string;
};

export default function ReportKpis({
  report,
  currency,
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
      {/* Revenue */}
      <div
        className="
          relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Revenue
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(report.revenue, { currency })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Revenue in selected period
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
      </div>

      {/* Expenses */}
      <div
        className="
          relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Expenses
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(report.expenses, { currency })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Expenses in selected period
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />
        </div>
      </div>

      {/* Profit */}
      <div
        className="
          relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Profit
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(report.profit, { currency })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Net profit in selected period
            </div>
          </div>

          <div
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${
              report.profit >= 0
                ? "bg-emerald-500 ring-emerald-100"
                : "bg-red-500 ring-red-100"
            }`}
          />
        </div>
      </div>

      {/* Mortality */}
      <div
        className="
          relative overflow-hidden rounded-xl border border-blue-100 bg-white p-5
          shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
        "
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">
              Mortality
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(report.mortality).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Birds lost in selected period
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        </div>
      </div>
    </div>
  );
}