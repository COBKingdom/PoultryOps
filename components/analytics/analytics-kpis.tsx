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
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Production Rate
        </p>

        <h3 className="text-3xl font-bold text-blue-600 mt-2">
          {productionPercentage}%
        </h3>
      </div>

      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Mortality Rate
        </p>

        <h3 className="text-3xl font-bold text-amber-600 mt-2">
          {mortalityRate}%
        </h3>
      </div>

      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Profit Margin
        </p>

        <h3
          className={`text-3xl font-bold mt-2 ${
            Number(
              profitMargin
            ) >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {profitMargin}%
        </h3>
      </div>

      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <p className="text-slate-500 text-sm">
          Current Birds
        </p>

        <h3 className="text-3xl font-bold text-purple-600 mt-2">
          {currentBirds}
        </h3>
      </div>
    </div>
  );
}