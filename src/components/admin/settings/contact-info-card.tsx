"use client";

import React, { useState } from "react";
import { PhoneCall, ChevronUp, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { updateContactInformation } from "@/actions/settings";
import type { BusinessSettings } from "@/types/database";

interface ContactInfoCardProps {
  settings: BusinessSettings;
  onRefresh: () => Promise<void>;
  defaultExpanded?: boolean;
}

export function ContactInfoCard({
  settings,
  onRefresh,
  defaultExpanded = true,
}: ContactInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mobile, setMobile] = useState(settings.business_mobile || "");
  const [reachUs, setReachUs] = useState(settings.reach_us_number || "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await updateContactInformation({
      business_mobile: mobile,
      reach_us_number: reachUs,
      whatsapp_number: whatsapp,
    });

    setSaving(false);
    if (res.success) {
      setMessage({ text: "Contact information saved successfully.", type: "success" });
      await onRefresh();
    } else {
      setMessage({ text: res.message || "Failed to update contact information.", type: "error" });
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
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Contact Information
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Contact details to be shown on the website and WhatsApp receipts.
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
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Contact Phone <span className="text-red-500">*</span>
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Reach Us Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reachUs}
                onChange={(e) => setReachUs(e.target.value)}
                placeholder="e.g. 9994874805"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 9655965026"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                required
              />
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
