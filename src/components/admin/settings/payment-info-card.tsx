"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CreditCard,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { updatePaymentInformation, uploadBusinessAsset } from "@/actions/settings";
import type { BusinessSettings } from "@/types/database";

interface PaymentInfoCardProps {
  settings: BusinessSettings;
  onRefresh: () => Promise<void>;
  defaultExpanded?: boolean;
}

export function PaymentInfoCard({
  settings,
  onRefresh,
  defaultExpanded = true,
}: PaymentInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [upiNumbers, setUpiNumbers] = useState<string[]>(
    settings.gpay_upi_numbers && settings.gpay_upi_numbers.length > 0
      ? [...settings.gpay_upi_numbers]
      : ["9943745026", "8072736369"]
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(
    settings.gpay_qr_code_url || null
  );

  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleAddNumber = () => {
    setUpiNumbers([...upiNumbers, ""]);
  };

  const handleNumberChange = (index: number, val: string) => {
    const updated = [...upiNumbers];
    updated[index] = val;
    setUpiNumbers(updated);
  };

  const handleRemoveNumber = (index: number) => {
    if (upiNumbers.length <= 1) {
      setMessage({ text: "At least one GPay / UPI number is required.", type: "error" });
      return;
    }
    const updated = upiNumbers.filter((_, i) => i !== index);
    setUpiNumbers(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = upiNumbers.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNumbers.length === 0) {
      setMessage({ text: "Please provide at least one valid UPI number.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await updatePaymentInformation({
      gpay_upi_numbers: validNumbers,
      gpay_qr_code_url: qrCodeUrl,
    });

    setSaving(false);
    if (res.success) {
      setMessage({ text: "Payment information saved successfully.", type: "success" });
      await onRefresh();
    } else {
      setMessage({ text: res.message || "Failed to update payment information.", type: "error" });
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "qr");

    const res = await uploadBusinessAsset(formData);
    setUploadingQr(false);

    if (res.success && res.data) {
      setQrCodeUrl(res.data);
      setMessage({ text: "GPay QR Code uploaded. Click Save Changes to confirm.", type: "success" });
    } else {
      setMessage({ text: res.message || "Failed to upload QR code.", type: "error" });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0D7A4D] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Payment Information
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              GPay / UPI numbers and payment QR code for customer orders.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-md text-neutral-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <form onSubmit={handleSave} className="px-4 sm:px-5 pb-5 pt-1 border-t border-neutral-100 space-y-4">
          <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: GPay / UPI Numbers */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700">
                  GPay / UPI Numbers <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddNumber}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0D7A4D] hover:text-[#0B6B43]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Number</span>
                </button>
              </div>

              <div className="space-y-2">
                {upiNumbers.map((num, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-neutral-400 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={num}
                      onChange={(e) => handleNumberChange(idx, e.target.value)}
                      placeholder="e.g. 9943745026"
                      className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                      required
                    />
                    {upiNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNumber(idx)}
                        className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove number"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Accepted Methods Box */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-1 mt-4">
                <span className="font-bold text-neutral-800 block text-[11px] uppercase tracking-wide">
                  Accepted Payment Methods
                </span>
                <div className="flex items-center space-x-2 text-emerald-800 pt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0D7A4D]" />
                  <span className="font-semibold">GPay / UPI (Authoritative)</span>
                </div>
                <p className="text-[10px] text-neutral-500 pt-1">
                  Bank Transfer, Cash on Delivery, and payment gateways are disabled per approved architecture.
                </p>
              </div>
            </div>

            {/* Right: GPay QR Code Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-xl space-y-3">
              <div className="w-32 h-32 relative bg-white border border-neutral-200 rounded-lg p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt="GPay QR Code"
                    fill
                    sizes="130px"
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="text-center text-neutral-400 space-y-1">
                    <QrCode className="w-12 h-12 mx-auto stroke-1 text-neutral-400" />
                    <p className="text-[10px]">No QR Uploaded</p>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 shadow-2xs cursor-pointer transition-colors">
                {uploadingQr ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D7A4D]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span>{uploadingQr ? "Uploading..." : "Change QR Code"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleQrUpload}
                  disabled={uploadingQr}
                  className="hidden"
                />
              </label>

              <p className="text-[10px] text-neutral-400 text-center leading-tight">
                Stored in business storage bucket<br />Max 800 KB (PNG, JPG, WEBP)
              </p>
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {message && (
                <div
                  className={`text-xs font-medium flex items-center space-x-1.5 ${
                    message.type === "success" ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {message.type === "success" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{message.text}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
