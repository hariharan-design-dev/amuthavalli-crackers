import React from "react";
import Image from "next/image";

/**
 * Top Promotional Banner for Amuthavalli Crackers Product List
 * Displays the approved festive banner asset featuring company branding,
 * contact details, and minimum order threshold.
 *
 * Responsiveness:
 * - Proportional 16:9 aspect ratio matching the 1024x576 source asset
 * - Centered composition preserving branding, logo, and contact info
 * - No horizontal overflow across Mobile (375px), Tablet (768px), and Desktop (1440px)
 * - object-contain ensures no cropping of logo, text, phone numbers, address, or ₹3,000 value
 */
export function TopBanner() {
  return (
    <section
      aria-label="Amuthavalli Crackers Promotional Banner"
      className="w-full bg-[#FFF8F0]/40 border-b border-[#F7E7D8]/80"
    >
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex justify-center">
        <div className="relative w-full max-w-[1280px] aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs border border-[#FBE9DC] bg-[#FFF8F0]">
          <Image
            src="/images/banners/amuthavalli-banner-new.jpg"
            alt="Amuthavalli Crackers - Quality Crackers, Best Prices, Safe Celebrations in Sivakasi"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
            className="object-fill"
          />
        </div>
      </div>
    </section>
  );
}
