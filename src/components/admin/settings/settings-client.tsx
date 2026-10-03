"use client";

import React, { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ShopInfoCard } from "@/components/admin/settings/shop-info-card";
import { BusinessRulesCard } from "@/components/admin/settings/business-rules-card";
import { ContactInfoCard } from "@/components/admin/settings/contact-info-card";
import { PaymentInfoCard } from "@/components/admin/settings/payment-info-card";
import { AdminAccountCard } from "@/components/admin/settings/admin-account-card";
import {
  InvoiceSettingsCard,
  WebsiteInfoCard,
} from "@/components/admin/settings/unsupported-architecture-card";
import { getAdminBusinessSettings } from "@/actions/settings";
import type { BusinessSettings } from "@/types/database";

interface SettingsClientProps {
  initialSettings: BusinessSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);

  const handleRefresh = async () => {
    const res = await getAdminBusinessSettings();
    if (res.success && res.data) {
      setSettings(res.data);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Admin Top Header */}
      <AdminHeader
        searchPlaceholder="Search customers, orders, products..."
        onToggleMobileMenu={() => setMobileSidebarOpen(true)}
      />

      {/* 2. Admin Workspace (Sidebar + Main Content) */}
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Left Sidebar (with route-aware GREEN active state for Settings) */}
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0 space-y-5">
          {/* Header Row: Title & Subtitle */}
          <div id="general-settings">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Manage your shop settings, business rules and account information. All changes are applied immediately.
            </p>
          </div>

          {/* Settings Cards & Accordion Grid matching 1440px, 768px, and 375px */}
          <div className="space-y-4 sm:space-y-5">
            {/* Row 1: Shop Information & Business Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <ShopInfoCard
                settings={settings}
                onRefresh={handleRefresh}
                defaultExpanded={true}
              />
              <BusinessRulesCard
                settings={settings}
                onRefresh={handleRefresh}
                defaultExpanded={true}
              />
            </div>

            {/* Row 2: Contact Information & Payment Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <ContactInfoCard
                settings={settings}
                onRefresh={handleRefresh}
                defaultExpanded={true}
              />
              <PaymentInfoCard
                settings={settings}
                onRefresh={handleRefresh}
                defaultExpanded={true}
              />
            </div>

            {/* Row 3: Invoice Settings & Website Information (Architectural Boundary Handled) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <InvoiceSettingsCard defaultExpanded={false} />
              <WebsiteInfoCard defaultExpanded={false} />
            </div>

            {/* Row 4: Admin Account Password Management */}
            <AdminAccountCard defaultExpanded={true} />
          </div>
        </main>
      </div>
    </div>
  );
}
