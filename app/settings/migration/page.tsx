"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function MigrationPage() {
  const [sheets, setSheets] =
    useState<string[]>([]);

  const [selectedSheet, setSelectedSheet] =
    useState("");

  const [previewData, setPreviewData] =
    useState<any[]>([]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const data =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(data);

    setSheets(workbook.SheetNames);

    const firstSheet =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[firstSheet];

    const json =
      XLSX.utils.sheet_to_json(
        worksheet
      );

    setSelectedSheet(firstSheet);

    setPreviewData(
      json.slice(0, 10)
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-6">
        Data Migration
      </h1>

      <div className="bg-white border rounded-xl p-6">

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={
            handleFileUpload
          }
        />

      </div>

      {sheets.length > 0 && (

        <div className="mt-6 bg-white border rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Sheets Found
          </h2>

          <ul className="space-y-2">
            {sheets.map((sheet) => (
              <li
                key={sheet}
                className="p-2 border rounded"
              >
                {sheet}
              </li>
            ))}
          </ul>

        </div>

      )}

      {previewData.length > 0 && (

        <div className="mt-6 bg-white border rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Preview
          </h2>

          <pre className="overflow-auto text-xs">
            {JSON.stringify(
              previewData,
              null,
              2
            )}
          </pre>

        </div>

      )}

    </div>
  );
}