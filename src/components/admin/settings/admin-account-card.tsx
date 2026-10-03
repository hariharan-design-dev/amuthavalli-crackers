"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { updateAdminPassword } from "@/actions/settings";

interface AdminAccountCardProps {
  defaultExpanded?: boolean;
}

export function AdminAccountCard({ defaultExpanded = true }: AdminAccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage({ text: "New password must be at least 6 characters long.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Confirm password does not match new password.", type: "error" });
      return;
    }

    setUpdating(true);
    setMessage(null);

    const res = await updateAdminPassword({ newPassword });
    setUpdating(false);

    if (res.success) {
      setMessage({ text: "Admin password updated successfully via Supabase Auth.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ text: res.message || "Failed to update password.", type: "error" });
    }
  };

  return (
    <div id="admin-account" className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0D7A4D] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
              Admin Account
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Change your administrative password via Supabase Auth.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-md text-neutral-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="px-4 sm:px-5 pb-5 pt-1 border-t border-neutral-100 space-y-4">
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-lg text-neutral-800 focus:outline-none focus:border-[#0D7A4D] focus:ring-1 focus:ring-[#0D7A4D]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
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
              disabled={updating}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{updating ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
