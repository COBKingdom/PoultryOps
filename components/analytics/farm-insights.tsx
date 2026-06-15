type Props = {
  productionPercentage: number;
  totalMortality: number;
  currentBirds: number;
  totalRevenue: number;
  totalExpenses: number;
};

export default function FarmInsights({
  productionPercentage,
  totalMortality,
  currentBirds,
  totalRevenue,
  totalExpenses,
}: Props) {
  const mortalityRate =
    currentBirds + totalMortality > 0
      ? (
          (totalMortality /
            (currentBirds +
              totalMortality)) *
          100
        ).toFixed(1)
      : "0";

  const profit =
    totalRevenue -
    totalExpenses;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-900">
          Farm Insights
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Automated performance observations
        </p>

      </div>

      <div className="space-y-4">

        {profit < 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-medium text-red-700">
              ⚠ Farm is currently operating at a loss.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="font-medium text-green-700">
              ✓ Farm is currently profitable.
            </p>
          </div>
        )}

        {productionPercentage < 70 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-medium text-amber-700">
              ⚠ Production rate is below target.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="font-medium text-green-700">
              ✓ Production performance is healthy.
            </p>
          </div>
        )}

        {Number(mortalityRate) > 5 ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-medium text-red-700">
              ⚠ Mortality rate requires attention.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="font-medium text-green-700">
              ✓ Mortality remains within acceptable range.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}