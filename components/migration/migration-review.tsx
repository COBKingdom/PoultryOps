"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { SheetValidationResult, RowValidation } from "@/lib/migration/types";

interface MigrationReviewProps {
  sheets: SheetValidationResult[];
  onBack: () => void;
  onContinue: () => void;
}

export function MigrationReview({ sheets, onBack, onContinue }: MigrationReviewProps) {
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleSheet = (sheetName: string) => {
    setExpandedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetName)) {
        next.delete(sheetName);
      } else {
        next.add(sheetName);
      }
      return next;
    });
  };

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  // Calculate totals
  const totals = sheets.reduce(
    (acc, sheet) => ({
      total: acc.total + sheet.totalRows,
      valid: acc.valid + sheet.validRows,
      warnings: acc.warnings + sheet.warningRows,
      errors: acc.errors + sheet.errorRows,
      duplicates: acc.duplicates + sheet.duplicateRows,
      existingDuplicates: acc.existingDuplicates + (sheet.existingDuplicateRows || 0),
    }),
    { total: 0, valid: 0, warnings: 0, errors: 0, duplicates: 0, existingDuplicates: 0 }
  );

  const hasErrors = totals.errors > 0;
  const canImport = totals.valid > 0 || totals.warnings > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Review Your Data
        </h1>
        <p className="text-gray-600">
          Review the analysis of your workbook before importing.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Total Records</p>
          <p className="text-2xl font-semibold text-gray-900">{totals.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Ready</p>
          <p className="text-2xl font-semibold text-green-900">{totals.valid}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 mb-1">Warnings</p>
          <p className="text-2xl font-semibold text-yellow-900">{totals.warnings}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 mb-1">Errors</p>
          <p className="text-2xl font-semibold text-red-900">{totals.errors}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-700 mb-1">Duplicates</p>
          <p className="text-2xl font-semibold text-orange-900">{totals.duplicates + totals.existingDuplicates}</p>
        </div>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Your workbook has errors that must be fixed before importing.
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please correct the errors in your spreadsheet and upload it again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sheets List */}
      <div className="space-y-4 mb-8">
        {sheets.map((sheet) => (
          <div key={sheet.sheetName} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSheet(sheet.sheetName)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSheets.has(sheet.sheetName) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">{sheet.sheetName}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {sheet.validRows > 0 && (
                  <span className="text-green-700 font-medium">{sheet.validRows} ready</span>
                )}
                {sheet.warningRows > 0 && (
                  <span className="text-yellow-700 font-medium">{sheet.warningRows} warnings</span>
                )}
                {sheet.errorRows > 0 && (
                  <span className="text-red-700 font-medium">{sheet.errorRows} errors</span>
                )}
                {sheet.duplicateRows > 0 && (
                  <span className="text-orange-700 font-medium">{sheet.duplicateRows} duplicates</span>
                )}
                {sheet.existingDuplicateRows ? (
                  <span className="text-orange-700 font-medium">{sheet.existingDuplicateRows} existing</span>
                ) : null}
              </div>
            </button>

            {expandedSheets.has(sheet.sheetName) && (
              <div className="border-t border-gray-200">
                {sheet.rows.map((row) => (
                  <div key={row.rowIndex} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-4 py-2 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {row.status === "valid" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {row.status === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        {row.status === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            Row {row.rowIndex}
                          </span>
                          {row.isDuplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Workbook Duplicate
                            </span>
                          )}
                          {row.isExistingDuplicate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Existing in PoultryOps
                            </span>
                          )}
                        </div>
                        {(row.errors.length > 0 || row.warnings.length > 0) && (
                          <button
                            onClick={() => toggleRow(row.rowIndex)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                          >
                            {expandedRows.has(row.rowIndex) ? "Hide" : "Show"} details
                          </button>
                        )}
                      </div>
                    </div>
                    {(expandedRows.has(row.rowIndex) || row.status === "error") && (
                      <div className="px-4 pb-3 ml-7">
                        {row.errors.map((error, idx) => (
                          <p key={idx} className="text-xs text-red-700 mb-1">
                            • {error}
                          </p>
                        ))}
                        {row.warnings.map((warning, idx) => (
                          <p key={idx} className="text-xs text-yellow-700 mb-1">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Duplicate Explanation */}
      {(totals.duplicates > 0 || totals.existingDuplicates > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">About Duplicates</p>
              <p className="mb-2">
                <strong>Workbook Duplicates:</strong> Records that appear more than once in your uploaded file.
              </p>
              <p>
                <strong>Existing in PoultryOps:</strong> Records that already exist in your farm data.
              </p>
              <p className="mt-2">
                Both types are skipped by default during import to prevent duplicate records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Upload Different File
        </button>
        {canImport && (
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Confirm Import
          </button>
        )}
      </div>
    </div>
  );
}