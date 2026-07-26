"use client";

import { useState, useCallback } from "react";
import { MigrationStepper } from "@/components/migration/migration-stepper";
import { MigrationPrepare } from "@/components/migration/migration-prepare";
import { MigrationUpload } from "@/components/migration/migration-upload";
import { MigrationReview } from "@/components/migration/migration-review";
import { MigrationConfirm } from "@/components/migration/migration-confirm";
import { MigrationResults } from "@/components/migration/migration-results";
import type { SheetValidationResult } from "@/lib/migration/types";

type Stage = "prepare" | "upload" | "review" | "confirm" | "results";

interface ImportSummary {
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
}

export default function MigrationPage() {
  const [stage, setStage] = useState<Stage>("prepare");
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetValidationResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (uploadedFile: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/migration/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Unable to analyse workbook. Please try again.";
        
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response is not JSON (e.g., 500 error page)
          console.error("[MIGRATION] Non-JSON error response:", response.status, response.statusText);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSheets(data.sheets);
      setFile(uploadedFile);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse workbook");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Build targets from sheets that have importable rows
      const targets = sheets
        .filter((sheet) => sheet.validRows > 0 || sheet.warningRows > 0)
        .map((sheet) => ({
          sheetName: sheet.sheetName,
          dataType: sheet.dataType,
        }));

      formData.append("targets", JSON.stringify(targets));
      formData.append("options", JSON.stringify({
        batchSize: 100,
        skipDuplicates: true,
        defaultFlockId: null,
      }));

      const response = await fetch("/api/migration/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import workbook");
      }

      const data = await response.json();
      setImportSummary(data.summary);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import workbook");
    } finally {
      setIsImporting(false);
    }
  }, [file, sheets]);

  const handleReset = useCallback(() => {
    setStage("prepare");
    setFile(null);
    setSheets([]);
    setImportSummary(null);
    setError(null);
  }, []);

  const handleGoToDashboard = useCallback(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <MigrationStepper currentStage={stage} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-600 font-medium">Error</div>
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stage Content */}
        {stage === "prepare" && (
          <MigrationPrepare onContinue={() => setStage("upload")} />
        )}

        {stage === "upload" && (
          <MigrationUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        )}

        {stage === "review" && sheets.length > 0 && (
          <MigrationReview
            sheets={sheets}
            onBack={() => setStage("upload")}
            onContinue={() => setStage("confirm")}
          />
        )}

        {stage === "confirm" && file && (
          <MigrationConfirm
            sheets={sheets}
            file={file}
            onBack={() => setStage("review")}
            onConfirm={handleImport}
            isImporting={isImporting}
          />
        )}

        {stage === "results" && importSummary && (
          <MigrationResults
            summary={importSummary}
            onReset={handleReset}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
      </div>
    </div>
  );
}