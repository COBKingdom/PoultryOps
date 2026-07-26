"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, Loader2 } from "lucide-react";

interface MigrationUploadProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

export function MigrationUpload({ onAnalyze, isAnalyzing }: MigrationUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      alert("Please upload a valid .xlsx, .xls, or .csv file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid .xlsx, .xls, or .csv file");
    }
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (file) {
      onAnalyze(file);
    }
  }, [file, onAnalyze]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Upload Your Workbook
        </h1>
        <p className="text-gray-600">
          Upload the completed PoultryOps Migration Workbook to import your farm records.
        </p>
      </div>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          }`}
          style={{ minHeight: "240px", height: "260px" }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drag and drop your file here, or browse
            </p>
            <p className="text-xs text-gray-500">
              Supports .xlsx, .xls, and .csv files
            </p>
          </label>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <FileSpreadsheet className="w-10 h-10 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={handleRemove}
              disabled={isAnalyzing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRemove}
              disabled={isAnalyzing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Choose Different File
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                "Analyse Workbook"
              )}
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-700">
              Analysing your workbook... This may take a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function isValidFile(file: File): boolean {
  const validExtensions = [".xlsx", ".xls", ".csv"];
  const fileName = file.name.toLowerCase();
  return validExtensions.some((ext) => fileName.endsWith(ext));
}