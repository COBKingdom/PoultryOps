"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { SheetValidationResult } from "@/lib/migration/types";

interface MigrationConfirmProps {
  sheets: SheetValidationResult[];
  file: File;
  onBack: () => void;
  onConfirm: () => void;
  isImporting: boolean;
}

export function MigrationConfirm({ sheets, file, onBack, onConfirm, isImporting }: MigrationConfirmProps) {
  // Calculate totals
  const totals = sheets.reduce(
    (acc, sheet) => ({
      ready: acc.ready + sheet.validRows,
      warnings: acc.warnings + sheet.warningRows,
      errors: acc.errors + sheet.errorRows,
      duplicates: acc.duplicates + sheet.duplicateRows,
      existingDuplicates: acc.existingDuplicates + (sheet.existingDuplicateRows || 0),
    }),
    { ready: 0, warnings: 0, errors: 0, duplicates: 0, existingDuplicates: 0 }
  );

  const willBeSkipped = totals.duplicates + totals.existingDuplicates;
  const canImport = totals.ready > 0 || totals.warnings > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Confirm Import
        </h1>
        <p className="text-gray-600">
          Review the import summary before proceeding.
        </p>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-medium">File:</span> {file.name}
        </p>
      </div>

      {/* Import Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Import Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Ready to Import</span>
            <span className="text-sm font-semibold text-green-700">{totals.ready}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Warnings</span>
            <span className="text-sm font-semibold text-yellow-700">{totals.warnings}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Will Be Skipped (Duplicates)</span>
            <span className="text-sm font-semibold text-orange-700">{willBeSkipped}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-700">Errors (Will Not Import)</span>
            <span className="text-sm font-semibold text-red-700">{totals.errors}</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Data Type */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Breakdown by Data Type</h3>
        
        <div className="space-y-2">
          {sheets.map((sheet) => (
            <div key={sheet.sheetName} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">{sheet.sheetName}</span>
              <div className="flex items-center gap-4 text-xs">
                {sheet.validRows > 0 && (
                  <span className="text-green-700">{sheet.validRows} ready</span>
                )}
                {sheet.warningRows > 0 && (
                  <span className="text-yellow-700">{sheet.warningRows} warnings</span>
                )}
                {sheet.duplicateRows > 0 && (
                  <span className="text-orange-700">{sheet.duplicateRows} duplicates</span>
                )}
                {sheet.existingDuplicateRows ? (
                  <span className="text-orange-700">{sheet.existingDuplicateRows} existing</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">What will happen:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Valid records will be imported into PoultryOps</li>
              <li>Error records will not be imported</li>
              <li>Workbook duplicates will be skipped</li>
              <li>Records already existing in PoultryOps will be skipped</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isImporting}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        {canImport && (
          <button
            onClick={onConfirm}
            disabled={isImporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              "Import Records"
            )}
          </button>
        )}
      </div>
    </div>
  );
}