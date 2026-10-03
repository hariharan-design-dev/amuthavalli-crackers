"use client";

import React, { useState } from "react";
import { Settings as CogIcon, ChevronUp, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { updateBusinessRules } from "@/actions/settings";
import type { BusinessSettings } from "@/types/database";

interface BusinessRulesCardProps {
  settings: BusinessSettings;
  onRefresh: () => Promise<void>;
  defaultExpanded?: boolean;
}

export function BusinessRulesCard({
  settings,
  onRefresh,
  defaultExpanded = true,
}: BusinessRulesCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [minOrderValue, setMinOrderValue] = useState<string>(
    settings.min_order_value !== null ? String(settings.min_order_value) : "3000"
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(minOrderValue);
    if (isNaN(val) || val < 0) {
      setMessage({ text: "Please enter a valid non-negative order threshold.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await updateBusinessRules({ min_order_value: val });
    setSaving(false);

    if (res.success) {
      setMessage({ text: "Business rules updated successfully.", type: "success" });
      await onRefresh();
    } else {
      setMessage({ text: res.message || "Failed to update business rules.", type: "error" });
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
            <CogIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Business Settings
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure your business rules and preferences.
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
          <div className="pt-3 space-y-4">
            <div className="space-y-1.5 max-w-sm">
              <label className="text-xs font-semibold text-neutral-700">
                Minimum Order Value (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="3000"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                required
              />
              <p className="text-[11px] text-neutral-500">
                Customers must order at least this amount during online checkout.
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
