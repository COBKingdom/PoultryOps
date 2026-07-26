"use client";

import { Download } from "lucide-react";

interface MigrationPrepareProps {
  onContinue: () => void;
}

export function MigrationPrepare({ onContinue }: MigrationPrepareProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch("/api/migration/template");
      if (!response.ok) throw new Error("Failed to download template");
      
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Import Your Farm Records
        </h1>
        <p className="text-gray-600">
          Move your existing poultry farm records into PoultryOps from Excel.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-blue-900 mb-3">
          PoultryOps Migration Workbook
        </h2>
        <p className="text-sm text-blue-700 mb-4">
          Download the standard PoultryOps workbook, fill in your farm data,
          and upload it back to import your records.
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          How to use the migration workbook:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Download the PoultryOps Migration Workbook</li>
          <li>Enter or copy your existing farm records into the worksheets</li>
          <li>Save the workbook</li>
          <li>Upload it to PoultryOps on the next screen</li>
        </ol>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Already have a poultry farm spreadsheet?
        </h3>
        <p className="text-sm text-gray-600">
          PoultryOps can attempt to recognise compatible worksheets and column
          names automatically. However, not all spreadsheets can be imported.
          Using the PoultryOps Migration Workbook ensures the best results.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Upload
        </button>
      </div>
    </div>
  );
}