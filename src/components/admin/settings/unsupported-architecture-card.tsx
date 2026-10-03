"use client";

import React, { useState } from "react";
import {
  FileText,
  Globe,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";

export function InvoiceSettingsCard({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0D7A4D] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Invoice Settings
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure invoice number format and paper size.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-md text-neutral-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-neutral-100 space-y-3">
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/90 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-neutral-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wide">
                Invoice Architecture Notice
              </span>
            </div>

            <p className="text-neutral-600 leading-relaxed text-[11px] sm:text-xs">
              Invoice prefix (e.g. <code>AC</code>), starting sequence number (e.g. <code>260001</code>), and paper size configuration from the visual reference are <strong>not represented in the approved database schema</strong>.
            </p>

            <p className="text-neutral-500 text-[11px] leading-relaxed">
              In accordance with project architecture, order identifiers are locked to the native PostgreSQL sequence (<code>order_number_seq</code> producing <code>AMU-000001</code>). Invoices are derived documents rendered directly from order records. Full invoice generation, preview, print, and PDF will be implemented in the dedicated Invoice Management stage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function WebsiteInfoCard({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0D7A4D] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Website Information
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Basic information displayed on the website.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-md text-neutral-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-neutral-100 space-y-3">
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/90 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-neutral-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wide">
                Website Content Architecture Notice
              </span>
            </div>

            <p className="text-neutral-600 leading-relaxed text-[11px] sm:text-xs">
              Customer-facing branding content (such as shop tagline and short descriptions) is statically integrated into approved customer routes (<code>/home</code>, <code>/about</code>, <code>/contact</code>).
            </p>

            <p className="text-neutral-500 text-[11px] leading-relaxed">
              No CMS columns currently exist in the <code>business_settings</code> database table. To avoid fabricating unsupported database columns or creating arbitrary migrations, dynamic website content editing will be reviewed when a dedicated CMS specification is approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
