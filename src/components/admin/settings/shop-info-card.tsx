"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Store, ChevronUp, ChevronDown, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { updateShopInformation, uploadBusinessAsset } from "@/actions/settings";
import type { BusinessSettings } from "@/types/database";

interface ShopInfoCardProps {
  settings: BusinessSettings;
  onRefresh: () => Promise<void>;
  defaultExpanded?: boolean;
}

export function ShopInfoCard({
  settings,
  onRefresh,
  defaultExpanded = true,
}: ShopInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [name, setName] = useState(settings.business_name || "");
  const [address, setAddress] = useState(settings.business_address || "");
  const [mobile, setMobile] = useState(settings.business_mobile || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.business_logo_url || null);

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await updateShopInformation({
      business_name: name,
      business_address: address,
      business_mobile: mobile,
      business_logo_url: logoUrl,
    });

    setSaving(false);
    if (res.success) {
      setMessage({ text: "Shop information saved successfully.", type: "success" });
      await onRefresh();
    } else {
      setMessage({ text: res.message || "Failed to update shop information.", type: "error" });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "logo");

    const res = await uploadBusinessAsset(formData);
    setUploadingLogo(false);

    if (res.success && res.data) {
      setLogoUrl(res.data);
      setMessage({ text: "Logo uploaded. Click Save Changes to confirm.", type: "success" });
    } else {
      setMessage({ text: res.message || "Failed to upload logo.", type: "error" });
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
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Shop Information
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Your shop details for invoices and system use.
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3">
            {/* Left: Logo Upload Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-xl space-y-3">
              <div className="w-32 h-32 relative bg-white border border-neutral-200 rounded-lg p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                <Image
                  src={logoUrl || "/images/logo.jpg"}
                  alt={name || "Shop Logo"}
                  fill
                  sizes="130px"
                  className="object-contain p-1"
                />
              </div>

              <label className="inline-flex items-center justify-center space-x-2 px-3 py-1.5 bg-white border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-semibold text-neutral-700 shadow-2xs cursor-pointer transition-colors">
                {uploadingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D7A4D]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span>{uploadingLogo ? "Uploading..." : "Change Logo"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>

              <p className="text-[10px] text-neutral-400 text-center leading-tight">
                Recommended size: 400 × 400 px<br />Format: JPG, PNG, WEBP (Max 800 KB)
              </p>
            </div>

            {/* Right: Text Fields */}
            <div className="md:col-span-8 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amudhavalli Crackers"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical warehouse or store address"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D] resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9943745026"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                  required
                />
              </div>
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
