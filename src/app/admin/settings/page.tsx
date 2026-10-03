import React from "react";
import { SettingsClient } from "@/components/admin/settings/settings-client";
import { getAdminBusinessSettings } from "@/actions/settings";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const res = await getAdminBusinessSettings();

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900">
            Failed to Load Settings
          </h2>
          <p className="text-xs text-neutral-600">
            {res.message || "Could not retrieve business settings from database."}
          </p>
          <a
            href="/admin/settings"
            className="inline-block px-4 py-2 bg-[#0B3B32] hover:bg-[#072C24] text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }

  return <SettingsClient initialSettings={res.data} />;
}
