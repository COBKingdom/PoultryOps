"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/app-shell";
import OwnerOnly from "@/components/auth/owner-only";

import { supabase } from "@/lib/supabase";

type Flock = {
  id: string;
  flock_name: string;
  bird_type: string;
};

type SuccessData = {
  workbook: string;
  flock: string;
  message: string;
  importedAt: string;
};

export default function MigrationPage() {
  const { user } = useAuth();

  const [file, setFile] =
    useState<File | null>(null);

  const [sheets, setSheets] =
    useState<string[]>([]);

  const [selectedSheet, setSelectedSheet] =
    useState("");

  const [selectedFlock, setSelectedFlock] =
    useState("");

  const [previewData, setPreviewData] =
    useState<any[]>([]);

  const [flocks, setFlocks] =
    useState<Flock[]>([]);

  const [importing, setImporting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState<SuccessData | null>(null);

  useEffect(() => {
    loadFlocks();
  }, []);

  async function loadFlocks() {
    const { data, error } =
      await supabase
        .from("flocks")
        .select(
          "id, flock_name, bird_type"
        )
        .order("flock_name");

    if (!error && data) {
      setFlocks(data);
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFile =
      event.target.files?.[0];

    if (!uploadedFile) return;

    setError("");
    setSuccess(null);

    setFile(uploadedFile);

    const data =
      await uploadedFile.arrayBuffer();

    const workbook =
      XLSX.read(data);

    setSheets(
      workbook.SheetNames
    );

    const firstSheet =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[firstSheet];

    const json =
      XLSX.utils.sheet_to_json(
        worksheet
      );

    setSelectedSheet(
      firstSheet
    );

    setPreviewData(
      json.slice(0, 10)
    );
  };

  const handleSheetChange =
    async (
      sheetName: string
    ) => {
      if (!file) return;

      const data =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(data);

      const worksheet =
        workbook.Sheets[
          sheetName
        ];

      const json =
        XLSX.utils.sheet_to_json(
          worksheet
        );

      setSelectedSheet(
        sheetName
      );

      setPreviewData(
        json.slice(0, 10)
      );
    };

  const handleImport =
    async () => {
      setError("");
      setSuccess(null);

      if (!file) {
        setError(
          "Please select a workbook."
        );
        return;
      }

      if (!selectedSheet) {
        setError(
          "Please select a worksheet."
        );
        return;
      }

      if (
        selectedSheet !==
          "receipts record" &&
        !selectedFlock
      ) {
        setError(
          "Please select a flock."
        );
        return;
      }

      try {
        setImporting(true);

        const data =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(data);

        const worksheet =
          workbook.Sheets[
            selectedSheet
          ];

        const rows =
          XLSX.utils.sheet_to_json(
            worksheet
          );

        const response =
          await fetch(
            "/api/migration/import",
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  sheetName:
                    selectedSheet,
                  flockId:
                    selectedFlock,
                  rows,
                }
              ),
            }
          );

        const result =
          await response.json();

        if (
          result.success
        ) {
          const flock =
            flocks.find(
              (f) =>
                f.id ===
                selectedFlock
            );

          setSuccess({
            workbook:
              selectedSheet,
            flock:
              flock?.flock_name ||
              "N/A",
            message:
              result.message,
            importedAt:
              new Date().toLocaleString(),
          });
        } else {
          setError(
            result.error ||
              "Import failed."
          );
        }
      } catch (error) {
        console.error(
          error
        );

        setError(
          "Import failed."
        );
      } finally {
        setImporting(false);
      }
    };

  return (
    <OwnerOnly>
      <AppShell
        email={user?.email}
      >
        <div className="p-6 space-y-6">

          <div>
            <h1 className="text-4xl font-bold">
              Data Migration
            </h1>

            <p className="text-gray-500 mt-2">
              Import historical farm records from Excel.
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Upload Workbook
            </h2>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={
                handleFileUpload
              }
            />

          </div>

          {sheets.length > 0 && (
            <div className="bg-white border rounded-3xl p-6">

              <h2 className="text-xl font-semibold mb-4">
                Select Sheet
              </h2>

              <select
                value={
                  selectedSheet
                }
                onChange={(
                  e
                ) =>
                  handleSheetChange(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              >
                {sheets.map(
                  (sheet) => (
                    <option
                      key={
                        sheet
                      }
                      value={
                        sheet
                      }
                    >
                      {sheet}
                    </option>
                  )
                )}
              </select>

            </div>
          )}

          {selectedSheet &&
            selectedSheet !==
              "receipts record" && (
              <div className="bg-white border rounded-3xl p-6">

                <h2 className="text-xl font-semibold mb-4">
                  Select Flock
                </h2>

                <select
                  value={
                    selectedFlock
                  }
                  onChange={(
                    e
                  ) =>
                    setSelectedFlock(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">
                    Select Flock
                  </option>

                  {flocks.map(
                    (
                      flock
                    ) => (
                      <option
                        key={
                          flock.id
                        }
                        value={
                          flock.id
                        }
                      >
                        {
                          flock.flock_name
                        }{" "}
                        (
                        {
                          flock.bird_type
                        }
                        )
                      </option>
                    )
                  )}
                </select>

              </div>
            )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">

              <h3 className="font-semibold text-red-700">
                Migration Error
              </h3>

              <p className="text-red-600 mt-2">
                {error}
              </p>

            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl">
                  ✓
                </div>

                <div>

                  <h2 className="text-2xl font-bold text-green-700">
                    Migration Completed Successfully
                  </h2>

                  <p className="text-green-600">
                    Historical records imported into PoultryOps.
                  </p>

                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Workbook
                  </p>

                  <p className="font-semibold">
                    {success.workbook}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Flock
                  </p>

                  <p className="font-semibold">
                    {success.flock}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Imported At
                  </p>

                  <p className="font-semibold">
                    {success.importedAt}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <p className="font-semibold text-green-700">
                    Completed
                  </p>
                </div>

              </div>

              <div className="mt-6 p-4 bg-white rounded-xl border">

                <p className="font-medium">
                  Import Summary
                </p>

                <p className="text-gray-600 mt-2">
                  {success.message}
                </p>

              </div>

            </div>
          )}

          {previewData.length >
            0 && (
            <div className="bg-white border rounded-3xl p-6">

              <h2 className="text-xl font-semibold mb-4">
                Preview
              </h2>

              <div className="overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(
                    previewData,
                    null,
                    2
                  )}
                </pre>
              </div>

            </div>
          )}

          {previewData.length >
            0 && (
            <button
              onClick={
                handleImport
              }
              disabled={
                importing
              }
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {importing
                ? "Importing..."
                : "Start Import"}
            </button>
          )}

        </div>
      </AppShell>
    </OwnerOnly>
  );
}