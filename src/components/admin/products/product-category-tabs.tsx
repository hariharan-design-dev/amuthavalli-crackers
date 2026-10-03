"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminProductCategoryTab } from "@/types/admin-product";

interface ProductCategoryTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  categories: AdminProductCategoryTab[];
}

export function ProductCategoryTabs({
  activeTab,
  onSelectTab,
  categories,
}: ProductCategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => handleScroll("left")}
        className="hidden md:flex shrink-0 w-7 h-7 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-2xs hover:bg-neutral-50 text-neutral-600 mr-1.5 z-10 cursor-pointer"
        aria-label="Scroll categories left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontally Scrollable Pills Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1 w-full"
      >
        {categories.map((cat) => {
          const isActive = activeTab === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectTab(cat.id)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-[#0D7A4D] hover:bg-[#0B6B43] text-white shadow-xs"
                  : "bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/90"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`ml-1.5 text-[11px] font-normal ${
                  isActive ? "text-emerald-100" : "text-neutral-400"
                }`}
              >
                ({cat.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => handleScroll("right")}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-neutral-200 shadow-2xs hover:bg-neutral-50 text-neutral-600 ml-1.5 z-10 cursor-pointer"
        aria-label="Scroll categories right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
