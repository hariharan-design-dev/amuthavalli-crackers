"use client";

import React, { useState, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type {
  ExcelValidationSummary,
  ExcelImportResult,
} from "@/types/admin-product";
import {
  validateExcelFile,
  importValidatedExcelProducts,
} from "@/actions/admin-products";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: ExcelImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Async States
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation & Import Data
  const [summary, setSummary] = useState<ExcelValidationSummary | null>(null);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setSummary(null);
    setImportResult(null);
    setErrorMessage(null);
    onClose();
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMessage("Please select a valid .xlsx, .xls, or .csv file.");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleValidateStep = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await validateExcelFile(formData);
    setIsValidating(false);

    if (!res.success || !res.data) {
      setErrorMessage(res.message || "Failed to validate file.");
      return;
    }

    setSummary(res.data);
    setStep(2);
  };

  const handleConfirmImport = async () => {
    if (!summary || !summary.rows) return;

    setIsImporting(true);
    setErrorMessage(null);

    const res = await importValidatedExcelProducts(summary.rows, updateExisting);
    setIsImporting(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setImportResult(res);
    setStep(4);
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent =
      "Product Name,Tamil Name,Category,Market Rate,Selling Rate,Stock,Low Stock Alert,Description,Availability\n" +
      '4" Gold Lakshmi,4" கோல்ட் லட்சுமி,Single Crackers,40.00,35.00,250,50,Popular bright sparklers,true\n' +
      "Colour Koti,கலர் கோட்டி,Single Crackers,130.00,110.00,120,30,Colourful sparklers fountain,true\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "amuthavalli_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stepsList = [
    { num: 1, label: "Upload File" },
    { num: 2, label: "Validate Data" },
    { num: 3, label: "Review & Confirm" },
    { num: 4, label: "Complete" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isValidating && !isImporting && handleReset()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full sm:max-w-2xl lg:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D7A4D] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                Import Products via Excel
              </h2>
              <p className="text-xs text-neutral-500">
                Bulk upload catalogue items with automated column validation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isValidating || isImporting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Header */}
        <div className="bg-neutral-50/80 px-5 py-3 border-b border-neutral-200/80">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {stepsList.map((s, idx) => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDone
                          ? "bg-[#0D7A4D] text-white"
                          : isCurrent
                          ? "bg-[#0D7A4D] text-white ring-4 ring-emerald-100"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        isCurrent ? "text-neutral-900 font-bold" : "text-neutral-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        step > s.num ? "bg-[#0D7A4D]" : "bg-neutral-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: UPLOAD FILE                                          */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Drag & Drop Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="border-2 border-dashed border-neutral-300 hover:border-[#0D7A4D] bg-neutral-50/50 hover:bg-emerald-50/20 rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer"
              >
                <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-neutral-800">
                  Drag and drop your Excel or CSV file here
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="mt-4">
                  <span className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 bg-white border border-neutral-300 hover:border-neutral-400 rounded-lg text-neutral-700 shadow-2xs">
                    Browse File on Device
                  </span>
                </div>
              </div>

              {/* Selected File Card */}
              {selectedFile && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-[#0D7A4D]" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0D7A4D] bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Selected
                  </span>
                </div>
              )}

              {/* Required Columns & Template Download */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 space-y-2.5 text-xs text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">
                    Required Column Format
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="inline-flex items-center space-x-1 text-[#0D7A4D] hover:underline font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample Template</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Ensure your Excel file headers match: <strong>Product Name *</strong>,{" "}
                  <strong>Tamil Name</strong>, <strong>Category *</strong>,{" "}
                  <strong>Market Rate</strong>, <strong>Selling Rate *</strong>,{" "}
                  <strong>Stock</strong>, <strong>Low Stock Alert</strong>,{" "}
                  <strong>Description</strong>.
                </p>
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Note: Categories in the file must match existing database categories. Unknown categories will fail validation.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: VALIDATE DATA                                        */}
          {/* ============================================================ */}
          {step === 2 && summary && (
            <div className="space-y-4">
              {/* Validation Summary Metrics */}
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase">
                    Total
                  </span>
                  <span className="text-base font-black text-neutral-800">
                    {summary.totalRows}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-emerald-600 font-bold block uppercase">
                    Valid
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {summary.validRows}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-amber-600 font-bold block uppercase">
                    Updates
                  </span>
                  <span className="text-base font-black text-amber-700">
                    {summary.warningRows}
                  </span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-red-600 font-bold block uppercase">
                    Errors
                  </span>
                  <span className="text-base font-black text-red-700">
                    {summary.errorRows}
                  </span>
                </div>
              </div>

              {/* Rows Validation Table */}
              <div className="border border-neutral-200 rounded-lg overflow-x-auto max-h-64 scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-[10px] text-neutral-500 uppercase sticky top-0 border-b border-neutral-200">
                    <tr>
                      <th className="py-2 px-2.5">Row</th>
                      <th className="py-2 px-2.5">Product Name</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5 text-right">Selling Rate</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {summary.rows.map((r) => (
                      <tr key={r.rowNumber} className="hover:bg-neutral-50">
                        <td className="py-2 px-2.5 font-mono text-neutral-400">
                          #{r.rowNumber}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-neutral-900">
                          {r.productName}
                          {r.errorMessages && r.errorMessages.length > 0 && (
                            <p className="text-[10px] text-red-500 font-normal">
                              {r.errorMessages.join(", ")}
                            </p>
                          )}
                          {r.isExisting && (
                            <p className="text-[10px] text-amber-600 font-normal">
                              Existing product (will update if enabled)
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-600">
                          {r.matchedCategoryName || r.category}
                        </td>
                        <td className="py-2 px-2.5 text-right font-medium text-neutral-800">
                          {r.sellingRate ? `₹ ${r.sellingRate.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-2.5">
                          {r.status === "valid" && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              New
                            </span>
                          )}
                          {r.status === "warning" && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Update
                            </span>
                          )}
                          {r.status === "error" && (
                            <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-neutral-400">
                Normalization automatically matches categories regardless of casing or extra spacing.
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: REVIEW & CONFIRM                                     */}
          {/* ============================================================ */}
          {step === 3 && summary && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Import Summary
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 text-center">
                    <span className="text-[10px] text-neutral-500 block">Valid Rows</span>
                    <span className="text-lg font-black text-emerald-700">
                      {summary.validRows}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 text-center">
                    <span className="text-[10px] text-neutral-500 block">Skipped (Errors)</span>
                    <span className="text-lg font-black text-red-600">
                      {summary.errorRows}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 text-center">
                    <span className="text-[10px] text-neutral-500 block">New Products</span>
                    <span className="text-lg font-black text-blue-600">
                      {summary.newProductsCount}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 text-center">
                    <span className="text-[10px] text-neutral-500 block">To Update</span>
                    <span className="text-lg font-black text-amber-600">
                      {summary.existingProductsCount}
                    </span>
                  </div>
                </div>

                {/* Overwrite Checkbox */}
                <label className="flex items-center space-x-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded border-neutral-300 text-[#0D7A4D] focus:ring-[#0D7A4D]"
                  />
                  <span className="text-xs text-neutral-700 font-medium">
                    Update existing products when matching name is found
                  </span>
                </label>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800">
                <p className="font-semibold">
                  Ready to process {summary.validRows} valid rows
                </p>
                <p className="text-[11px] mt-0.5 text-amber-700">
                  {summary.errorRows > 0
                    ? `${summary.errorRows} rows with errors will be skipped automatically.`
                    : "All rows passed validation."}
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: IMPORT COMPLETE                                      */}
          {/* ============================================================ */}
          {step === 4 && importResult && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-[#0D7A4D] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  {importResult.createdCount + importResult.updatedCount} products have been processed and saved to your Supabase catalogue.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 max-w-xs mx-auto text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-500">File processed:</span>
                  <span className="font-semibold text-neutral-800 truncate max-w-[150px]">
                    {selectedFile?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">New products created:</span>
                  <span className="font-bold text-emerald-700">
                    {importResult.createdCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Existing products updated:</span>
                  <span className="font-bold text-amber-700">
                    {importResult.updatedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Skipped (errors/disabled):</span>
                  <span className="font-bold text-neutral-500">
                    {importResult.skippedCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50/50">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              disabled={isImporting}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            {step < 4 ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isValidating || isImporting}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleValidateStep}
                    disabled={!selectedFile || isValidating}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isValidating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isValidating ? "Validating..." : "Validate File"}</span>
                    {!isValidating && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!summary || summary.validRows === 0}
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0D7A4D] hover:bg-[#0B6B43] text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isImporting ? "Importing..." : "Confirm & Import"}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 bg-[#0D7A4D] hover:bg-[#0B6B43] text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
