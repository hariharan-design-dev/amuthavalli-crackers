"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import { useCart } from "@/context/cart-context";

import { AboutHero } from "@/components/about/about-hero";
import { OurStory } from "@/components/about/our-story";
import { OurValues } from "@/components/about/our-values";
import { OurCommitment } from "@/components/about/our-commitment";
import { HomeFooter } from "@/components/home/home-footer";

export default function AboutPage() {
  const router = useRouter();
  const { totalQuantity } = useCart();

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* 1. Header Area: Dark Navy Top Info Bar & Main Header with activeNav="about" */}
      <TopInfoBar />
      <CustomerHeader
        totalItems={totalQuantity}
        activeNav="about"
        cartVariant="compact"
        onCartClick={() => router.push("/checkout")}
      />

      <main className="flex-1 w-full">
        {/* 2. About Hero Section */}
        <AboutHero />

        {/* 3. Our Story Section */}
        <OurStory />

        {/* 4. Our Values Section */}
        <OurValues />

        {/* 5. Our Commitment Section */}
        <OurCommitment />
      </main>

      {/* 6. Footer */}
      <HomeFooter />
    </div>
  );
}
