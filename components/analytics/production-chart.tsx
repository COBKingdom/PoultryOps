"use client";

type Props = {
  eggs: number;
  birds: number;
};

export default function ProductionChart({
  eggs,
  birds,
}: Props) {
  const productionPercentage =
    birds > 0
      ? (
          (eggs / birds) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Production Performance
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Daily flock productivity
        </p>
      </div>

      <div className="space-y-6">

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>
              Production Rate
            </span>

            <span className="font-semibold">
              {productionPercentage}%
            </span>
          </div>

          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="
                h-full
                bg-gradient-to-r
                from-blue-600
                to-indigo-700
              "
              style={{
                width: `${productionPercentage}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Available Birds
            </p>

            <h3 className="text-3xl font-bold text-slate-900 mt-2">
              {Number(birds).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Current birds on the farm
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-sm text-slate-500">
              Today's Eggs
            </p>

            <h3 className="text-3xl font-bold text-blue-600 mt-2">
              {Number(eggs).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>

        </div>

      </div>

    </div>
  );
}