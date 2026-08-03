type Props = {
  report: any;
};

export default function ProductionSummary({
  report,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Production Summary
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-slate-50 rounded-xl p-4">

          <p className="text-sm text-slate-500">
            Available Birds
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {Number(report.availableBirds).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </h3>

        </div>

        <div className="bg-slate-50 rounded-xl p-4">

          <p className="text-sm text-slate-500">
            Today's Eggs
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {Number(report.eggs).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </h3>

        </div>

        <div className="bg-slate-50 rounded-xl p-4">

          <p className="text-sm text-slate-500">
            Feed Used
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {Number(report.feed).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}kg
          </h3>

        </div>

        <div className="bg-slate-50 rounded-xl p-4">

          <p className="text-sm text-slate-500">
            Mortality
          </p>

          <h3 className="text-3xl font-bold mt-2 text-red-600">
            {Number(report.mortality).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </h3>

        </div>

      </div>

    </div>
  );
}