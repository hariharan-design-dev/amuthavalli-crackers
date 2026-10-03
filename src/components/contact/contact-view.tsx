"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import { useCart } from "@/context/cart-context";
import { ContactHero } from "./contact-hero";
import { ContactDetails } from "./contact-details";
import { VisitOurStore } from "./visit-our-store";
import { HomeFooter } from "@/components/home/home-footer";
import type { BusinessSettings } from "@/types/database";

interface ContactViewProps {
  businessSettings?: BusinessSettings | null;
}

export function ContactView({ businessSettings }: ContactViewProps) {
  const router = useRouter();
  const { totalQuantity } = useCart();

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* 1. Header: Dark Navy Top Info Bar & Main Customer Header with activeNav="contact" */}
      <TopInfoBar />
      <CustomerHeader
        totalItems={totalQuantity}
        activeNav="contact"
        cartVariant="compact"
        onCartClick={() => router.push("/checkout")}
      />

      <main className="flex-1 w-full">
        {/* 2. Contact Hero */}
        <ContactHero />

        {/* 3. Contact Details (5 approved items using business data layer) */}
        <ContactDetails businessSettings={businessSettings} />

        {/* 4. Visit Our Store */}
        <VisitOurStore />
      </main>

      {/* 5. Footer */}
      <HomeFooter />
    </div>
  );
}
