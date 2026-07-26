"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  const [importSummary, setImportSummary] =
    useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get the access token from the same Supabase browser session
   * already used by PoultryOps.
   */
  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        "Unable to verify your login session. Please sign in again."
      );
    }

    if (!session?.access_token) {
      throw new Error(
        "Your login session is unavailable or has expired. Please sign in again."
      );
    }

    return session.access_token;
  }, []);

  /**
   * Analyse and validate the uploaded workbook.
   */
  const handleAnalyze = useCallback(
    async (uploadedFile: File) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const accessToken = await getAccessToken();

        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await fetch("/api/migration/parse", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          let errorMessage =
            "Unable to analyse workbook. Please try again.";

          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            console.error(
              "[MIGRATION] Non-JSON error response:",
              response.status,
              response.statusText
            );
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!Array.isArray(data.sheets)) {
          throw new Error(
            "The workbook analysis returned an invalid response."
          );
        }

        setSheets(data.sheets);
        setFile(uploadedFile);
        setStage("review");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyse workbook"
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [getAccessToken]
  );

  /**
   * Import the validated workbook.
   */
  const handleImport = useCallback(async () => {
    if (!file) {
      setError("No workbook is available to import.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      const formData = new FormData();
      formData.append("file", file);

      const targets = sheets
        .filter(
          (sheet) =>
            sheet.validRows > 0 || sheet.warningRows > 0
        )
        .map((sheet) => ({
          sheetName: sheet.sheetName,
          dataType: sheet.dataType,
        }));

      if (targets.length === 0) {
        throw new Error(
          "There are no validated records available to import."
        );
      }

      formData.append("targets", JSON.stringify(targets));

      formData.append(
        "options",
        JSON.stringify({
          batchSize: 100,
          skipDuplicates: true,
          defaultFlockId: null,
        })
      );

      const response = await fetch("/api/migration/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to import workbook.";

        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          console.error(
            "[MIGRATION] Non-JSON import error response:",
            response.status,
            response.statusText
          );
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.summary) {
        throw new Error(
          "The import completed without returning a valid summary."
        );
      }

      setImportSummary(data.summary);
      setStage("results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import workbook"
      );
    } finally {
      setIsImporting(false);
    }
  }, [file, sheets, getAccessToken]);

  /**
   * Reset the migration workflow.
   */
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <MigrationStepper currentStage={stage} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="font-medium text-red-600">
                Error
              </div>

              <p className="flex-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Prepare */}
        {stage === "prepare" && (
          <MigrationPrepare
            onContinue={() => setStage("upload")}
          />
        )}

        {/* Upload */}
        {stage === "upload" && (
          <MigrationUpload
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Review */}
        {stage === "review" && sheets.length > 0 && (
          <MigrationReview
            sheets={sheets}
            onBack={() => setStage("upload")}
            onContinue={() => setStage("confirm")}
          />
        )}

        {/* Confirm */}
        {stage === "confirm" && file && (
          <MigrationConfirm
            sheets={sheets}
            file={file}
            onBack={() => setStage("review")}
            onConfirm={handleImport}
            isImporting={isImporting}
          />
        )}

        {/* Results */}
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