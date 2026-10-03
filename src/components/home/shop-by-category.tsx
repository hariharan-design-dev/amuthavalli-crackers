import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_CATEGORIES } from "@/lib/data/home-data";

export function ShopByCategory() {
  return (
    <section className="w-full bg-[#FDFBF9] py-8 sm:py-12 border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#D62828] uppercase tracking-wider block">
              EXPLORE OUR COLLECTION
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 mt-0.5 font-serif">
              Shop by Category
            </h2>
          </div>

          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 border border-red-200 text-[#D62828] hover:bg-red-50 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Categories Horizontal Presentation (Scrollable on mobile/tablet, full row on desktop) */}
        <div className="relative">
          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x">
            {HOME_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href="/"
                className="group flex flex-col items-center shrink-0 w-[72px] sm:w-[84px] text-center snap-start transition-transform active:scale-95"
              >
                {/* Circular Icon Container */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF5EB] border border-[#FBE9DC] flex items-center justify-center p-2.5 shadow-2xs group-hover:shadow-md group-hover:scale-105 group-hover:border-red-300 transition-all duration-200 relative overflow-hidden">
                  <Image
                    src={cat.iconImage}
                    alt={cat.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>

                {/* Category Label */}
                <span className="mt-2 text-[11px] sm:text-xs font-medium text-neutral-800 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
