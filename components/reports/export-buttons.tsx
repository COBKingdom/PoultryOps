"use client";

type Props = {
  report: any;
};

export default function ExportButtons({
  report,
}: Props) {

  function exportProduction() {
    const csv =
`Metric,Value
Current Birds,${report.currentBirds}
Today's Eggs,${report.eggs}
Feed Used,${report.feed}
Mortality,${report.mortality}`;

    downloadCsv(
      csv,
      "production-report.csv"
    );
  }

  function exportFinancial() {
    const csv =
`Metric,Value
Revenue,${report.revenue}
Expenses,${report.expenses}
Profit,${report.profit}`;

    downloadCsv(
      csv,
      "financial-report.csv"
    );
  }

  function downloadCsv(
    csv: string,
    filename: string
  ) {
    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      filename;

    a.click();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-4">
        Export Reports
      </h2>

      <div className="flex gap-4">

        <button
          onClick={
            exportProduction
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Export Production
        </button>

        <button
          onClick={
            exportFinancial
          }
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Export Financial
        </button>

      </div>

    </div>
  );
}