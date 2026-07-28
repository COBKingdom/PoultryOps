"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";

interface MigrationPrepareProps {
  onContinue: () => void;
}

export function MigrationPrepare({ onContinue }: MigrationPrepareProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch("/api/migration/template");

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "PoultryOps Migration Workbook.xlsx";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download template. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Import Your Farm Records
        </h1>

        <p className="text-gray-600">
          Choose how you want to bring your existing poultry farm records into
          PoultryOps.
        </p>
      </div>

      {/* Migration Options */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Option 1 — Existing Spreadsheet */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
              <Upload className="w-5 h-5 text-gray-700" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Option 1
              </p>

              <h2 className="text-lg font-semibold text-gray-900">
                Upload Your Existing Spreadsheet
              </h2>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Already keep your poultry farm records in Excel? Upload your
            existing spreadsheet and PoultryOps will attempt to recognise
            compatible worksheets and column names automatically.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <p className="text-sm text-gray-700">
              PoultryOps supports recognised legacy farm spreadsheet formats
              and common column names such as egg production, feed usage,
              mortality, medication, bird sales and other farm records.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Existing Spreadsheet
          </button>
        </div>

        {/* Option 2 — PoultryOps Workbook */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm relative">
          <div className="absolute -top-3 right-4">
            <span className="inline-flex px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-full">
              Recommended
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Option 2
              </p>

              <h2 className="text-lg font-semibold text-blue-950">
                PoultryOps Migration Workbook
              </h2>
            </div>
          </div>

          <p className="text-sm text-blue-800 mb-4">
            For the most reliable migration, download our standard workbook,
            copy your existing farm records into the provided worksheets and
            upload it to PoultryOps.
          </p>

          <div className="bg-white/70 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-sm text-blue-900">
              The standard workbook provides dedicated sheets for Flocks, Egg
              Production, Feed Consumption, Feed Purchases, Health, Mortality,
              Sales and Expenses.
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Migration Workbook
          </button>
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          What happens after you upload?
        </h3>

        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>PoultryOps analyses the workbook and identifies supported records.</li>
          <li>Your records are validated before anything is imported.</li>
          <li>You review valid records, warnings, errors and possible duplicates.</li>
          <li>You confirm exactly what should be imported.</li>
          <li>PoultryOps securely imports the records into your farm account.</li>
        </ol>
      </div>

      {/* Compatibility notice */}
      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Using your own spreadsheet?</span>{" "}
          PoultryOps can automatically recognise many compatible column names
          and legacy farm spreadsheet formats, but not every spreadsheet
          structure can be imported automatically. If your spreadsheet is not
          recognised, use the PoultryOps Migration Workbook for the most
          reliable migration.
        </p>
      </div>
    </div>
  );
}