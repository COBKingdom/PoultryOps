type Props = {
  currentBirds: number;
  productionPercentage: number;
  totalMortality: number;
  totalRevenue: number;
  totalExpenses: number;
};

export default function AnalyticsKpis({
  currentBirds,
  productionPercentage,
  totalMortality,
  totalRevenue,
  totalExpenses,
}: Props) {
  const profitMargin =
    totalRevenue > 0
      ? (
          ((totalRevenue -
            totalExpenses) /
            totalRevenue) *
          100
        ).toFixed(1)
      : "0";

  const mortalityRate =
    currentBirds + totalMortality > 0
      ? (
          (totalMortality /
            (currentBirds +
              totalMortality)) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div
      className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-4
      "
    >
      {/* Production Rate */}
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
              Production Rate
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {productionPercentage}%
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Current egg production
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        </div>
      </div>

      {/* Mortality Rate */}
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
              Mortality Rate
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {mortalityRate}%
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Mortality across current flock
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        </div>
      </div>

      {/* Profit Margin */}
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
              Profit Margin
            </div>

            <div
              className={`mt-2 text-3xl font-bold tracking-tight ${
                Number(profitMargin) >= 0
                  ? "text-slate-900"
                  : "text-slate-900"
              }`}
            >
              {profitMargin}%
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Revenue less expenses
            </div>
          </div>

          <div
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${
              Number(profitMargin) >= 0
                ? "bg-emerald-500 ring-emerald-100"
                : "bg-red-500 ring-red-100"
            }`}
          />
        </div>
      </div>

      {/* Available Birds */}
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
              Available Birds
            </div>

            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {Number(currentBirds).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Current birds on the farm
            </div>
          </div>

          <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-purple-500 ring-4 ring-purple-100" />
        </div>
      </div>
    </div>
  );
}