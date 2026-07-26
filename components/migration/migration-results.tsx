"use client";

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface MigrationResultsProps {
  summary: {
    targets: Array<{
      sheetName: string;
      dataType: string;
      totalRows: number;
      inserted: number;
      skipped: number;
      failed: number;
      errors: string[];
    }>;
    totalInserted: number;
    totalSkipped: number;
    totalFailed: number;
  };
  onReset: () => void;
  onGoToDashboard: () => void;
}

export function MigrationResults({ summary, onReset, onGoToDashboard }: MigrationResultsProps) {
  const hasFailures = summary.totalFailed > 0;
  const hasSkipped = summary.totalSkipped > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Import Complete
        </h1>
        <p className="text-gray-600">
          Your farm records have been imported into PoultryOps.
        </p>
      </div>

      {/* Overall Status */}
      <div className={`border rounded-lg p-6 mb-6 ${
        hasFailures
          ? "bg-yellow-50 border-yellow-200"
          : "bg-green-50 border-green-200"
      }`}>
        <div className="flex items-start gap-3">
          {hasFailures ? (
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              hasFailures ? "text-yellow-900" : "text-green-900"
            }`}>
              {hasFailures
                ? "Import completed with some issues"
                : "Import completed successfully"}
            </p>
            <p className={`text-sm mt-1 ${
              hasFailures ? "text-yellow-700" : "text-green-700"
            }`}>
              {summary.totalInserted} records imported successfully
              {hasSkipped && ` • ${summary.totalSkipped} skipped`}
              {hasFailures && ` • ${summary.totalFailed} failed`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Successfully Imported</p>
          <p className="text-2xl font-semibold text-green-900">{summary.totalInserted}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-700 mb-1">Skipped</p>
          <p className="text-2xl font-semibold text-orange-900">{summary.totalSkipped}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 mb-1">Failed</p>
          <p className="text-2xl font-semibold text-red-900">{summary.totalFailed}</p>
        </div>
      </div>

      {/* Breakdown by Data Type */}
      {summary.targets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Breakdown by Data Type</h3>
          
          <div className="space-y-3">
            {summary.targets.map((target) => (
              <div key={target.sheetName} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700">{target.sheetName}</span>
                <div className="flex items-center gap-4 text-xs">
                  {target.inserted > 0 && (
                    <span className="text-green-700 font-medium">{target.inserted} imported</span>
                  )}
                  {target.skipped > 0 && (
                    <span className="text-orange-700 font-medium">{target.skipped} skipped</span>
                  )}
                  {target.failed > 0 && (
                    <span className="text-red-700 font-medium">{target.failed} failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skipped Explanation */}
      {hasSkipped && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">About Skipped Records</p>
              <p>
                Records were skipped because they were duplicates (either within your workbook or already existing in PoultryOps).
                This prevents duplicate data from being created.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {hasFailures && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-2">Import Errors</p>
              {summary.targets
                .filter((t) => t.errors.length > 0)
                .map((target, idx) => (
                  <div key={idx} className="text-sm text-red-700 mb-2">
                    <p className="font-medium">{target.sheetName}:</p>
                    {target.errors.map((error, errorIdx) => (
                      <p key={errorIdx} className="ml-4">• {error}</p>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onGoToDashboard}
          className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
        <button
          onClick={onReset}
          className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}