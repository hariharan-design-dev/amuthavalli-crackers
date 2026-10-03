"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import { useCart } from "@/context/cart-context";

import { HomeHero } from "@/components/home/home-hero";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { PopularProducts } from "@/components/home/popular-products";
import { AboutAmuthavalli } from "@/components/home/about-amuthavalli";
import { NewArrivals } from "@/components/home/new-arrivals";
import { CelebrationCTA } from "@/components/home/celebration-cta";
import { HomeFooter } from "@/components/home/home-footer";

export default function HomePage() {
  const router = useRouter();
  const { totalQuantity } = useCart();

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* 1. Header Area: Dark Navy Top Info Bar & Main Header */}
      <TopInfoBar />
      <CustomerHeader
        totalItems={totalQuantity}
        activeNav="home"
        cartVariant="compact"
        onCartClick={() => router.push("/checkout")}
      />

      <main className="flex-1 w-full">
        {/* 2. Hero Section (Includes Embedded Desktop Trust Points Strip & Mobile 2x2 Grid) */}
        <HomeHero />

        {/* 4. Shop by Category */}
        <ShopByCategory />

        {/* 5. Popular Products (Approved Typed-Quantity Input, No +/- and No Add Button) */}
        <PopularProducts />

        {/* 6. About Amuthavalli */}
        <AboutAmuthavalli />

        {/* 7. New Arrivals (Approved Typed-Quantity Input, No +/- and No Add Button) */}
        <NewArrivals />

        {/* 8. Bottom Celebration CTA */}
        <CelebrationCTA />
      </main>

      {/* 9. Footer */}
      <HomeFooter />
    </div>
  );
}
