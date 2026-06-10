type Props = {
  report: any;
};

export default function ProductionSummary({
  report,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Production Summary
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>
            Current Birds
          </span>

          <strong>
            {
              report.currentBirds
            }
          </strong>
        </div>

        <div className="flex justify-between">
          <span>
            Today's Eggs
          </span>

          <strong>
            {
              report.eggs
            }
          </strong>
        </div>

        <div className="flex justify-between">
          <span>
            Feed Used
          </span>

          <strong>
            {
              report.feed
            }kg
          </strong>
        </div>

        <div className="flex justify-between">
          <span>
            Mortality
          </span>

          <strong>
            {
              report.mortality
            }
          </strong>
        </div>

      </div>

    </div>
  );
}