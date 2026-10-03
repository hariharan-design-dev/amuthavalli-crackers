"use client";

import React, { useRef } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  categories?: Array<{ id: string; name: string }>;
}

export function CategoryNav({
  activeCategory = "All Products",
  onSelectCategory,
  categories = [],
}: CategoryNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-[#FFF8F0] border-b border-[#F7E7D8] py-2.5 sm:py-3 sticky top-16 sm:top-20 z-30 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative flex items-center">
        {/* Scroll Left Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="hidden md:flex shrink-0 w-7 h-7 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-2xs hover:bg-neutral-50 text-neutral-600 mr-2 z-10 cursor-pointer"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Categories Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar py-0.5 w-full scrollbar-none"
        >
          {/* All Products Pill */}
          <button
            type="button"
            onClick={() => onSelectCategory?.("All Products")}
            className={cn(
              "flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer",
              activeCategory === "All Products"
                ? "bg-[#D62828] text-white shadow-xs"
                : "bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Products</span>
            <span className="sm:hidden">All</span>
          </button>

          {/* Dynamic Real Categories */}
          {categories.map((cat) => {
            const isCatActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory?.(cat.name)}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer whitespace-nowrap",
                  isCatActive
                    ? "bg-[#D62828] text-white font-semibold shadow-xs"
                    : "bg-white/80 text-neutral-800 hover:text-red-600 hover:bg-white border border-neutral-200/60"
                )}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="hidden md:flex shrink-0 w-7 h-7 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-2xs hover:bg-neutral-50 text-neutral-600 ml-2 z-10 cursor-pointer"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
