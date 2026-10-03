"use client";

import React from "react";
import { ProductCard } from "./product-card";
import type { AdminProduct } from "@/types/admin-product";
import { PackageOpen } from "lucide-react";

interface ProductGridProps {
  products: AdminProduct[];
  onEdit: (product: AdminProduct) => void;
  onDelete: (productId: string) => void;
  onToggleAvailability: (productId: string, currentAvailable: boolean) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function ProductGrid({
  products,
  onEdit,
  onDelete,
  onToggleAvailability,
  onClearFilters,
  loading = false,
}: ProductGridProps) {
  if (loading) {
    return (
      <div>
        {/* Desktop skeleton grid */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200/80 p-3 sm:p-3.5 shadow-2xs space-y-3 animate-pulse"
            >
              <div className="w-full aspect-square bg-neutral-200 rounded-lg" />
              <div className="space-y-2">
                <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
              </div>
              <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
                <div className="h-4 bg-neutral-200 rounded-full w-16" />
                <div className="h-4 bg-neutral-200 rounded w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile skeleton list */}
        <div className="sm:hidden space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-2xs flex items-center space-x-3 animate-pulse"
            >
              <div className="w-18 h-18 bg-neutral-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
                <div className="h-3 bg-neutral-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200/80 p-8 sm:p-12 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <PackageOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-neutral-800">
          No products found
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          No products matched your search or active filters. Try adjusting your query or resetting all filters.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-[#0D7A4D] text-white hover:bg-[#0B6B43] transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop (5 columns on xl/1440px, 4 on lg, 3 on md) & Tablet (2 columns) */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        ))}
      </div>

      {/* Mobile Single Column Horizontal Cards */}
      <div className="sm:hidden space-y-2.5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        ))}
      </div>
    </div>
  );
}
