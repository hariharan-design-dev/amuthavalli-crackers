import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_NEW_ARRIVALS } from "@/lib/data/home-data";
import { ProductCard } from "./product-card";

export function NewArrivals() {
  return (
    <section className="w-full bg-[#FDFBF9] py-8 sm:py-12 border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#D62828] uppercase tracking-wider block">
              NEW FOR 2026
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 mt-0.5 font-serif">
              New Arrivals
            </h2>
          </div>

          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 border border-red-200 text-[#D62828] hover:bg-red-50 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full transition-colors"
          >
            <span>View All New Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Product Cards Grid: 2 cols on mobile, 3 cols on tablet, 6 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-4">
          {HOME_NEW_ARRIVALS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
