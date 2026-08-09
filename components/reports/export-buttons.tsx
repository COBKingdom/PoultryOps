"use client";

import { formatCurrency } from "@/lib/currency";

type Props = {
  report: any;
  currency?: string;
};

export default function ExportButtons({
  report,
  currency,
}: Props) {

  function exportProduction() {
    const csv =
`Metric,Value
Available Birds,${report.availableBirds}
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
Revenue,${formatCurrency(report.revenue, { currency })}
Expenses,${formatCurrency(report.expenses, { currency })}
Profit,${formatCurrency(report.profit, { currency })}`;

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
    a.download = filename;
    a.click();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        Export Reports
      </h2>

      <div className="grid grid-cols-2 gap-3">

        <button
          onClick={
            exportProduction
          }
          className="bg-blue-600 text-white p-3 rounded-xl"
        >
          Export Production
        </button>

        <button
          onClick={
            exportFinancial
          }
          className="bg-green-600 text-white p-3 rounded-xl"
        >
          Export Financial
        </button>

        <button
          disabled
          className="bg-slate-200 text-slate-500 p-3 rounded-xl"
        >
          Email Report
        </button>

        <button
          disabled
          className="bg-slate-200 text-slate-500 p-3 rounded-xl"
        >
          WhatsApp Report
        </button>

      </div>

      <p className="text-xs text-slate-500 mt-4">
        Email and WhatsApp delivery coming soon.
      </p>

    </div>
  );
}