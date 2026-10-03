"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import type {
  CustomerCategoryGroup,
  CustomerProductItem,
} from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
  category: CustomerCategoryGroup;
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onProductClick: (product: CustomerProductItem) => void;
  selectedProductId?: string;
  defaultExpanded?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = "/images/products/gold_lakshmi.png";

export function CategorySection({
  category,
  quantities,
  onQuantityChange,
  onProductClick,
  selectedProductId,
  defaultExpanded = true,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleQtyInput = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newQty = isNaN(val) || val < 0 ? 0 : Math.min(val, 1000);
    onQuantityChange(productId, newQty);
  };

  return (
    <div className="w-full mb-3 rounded-lg overflow-hidden border border-[#FBE9DC] shadow-2xs">
      {/* Category Header Row */}
      <button
        type="button"
        onClick={toggleExpand}
        className={cn(
          "w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 transition-colors cursor-pointer select-none",
          "bg-[#FFF8F0] hover:bg-[#FFF3E8]"
        )}
        aria-expanded={isExpanded}
        aria-controls={`cat-content-${category.id}`}
      >
        {/* Left: Category Title */}
        <div className="flex items-center space-x-3 text-left">
          <h2 className="text-xs sm:text-sm font-bold text-[#D62828] uppercase tracking-wide">
            {category.name}
          </h2>
        </div>

        {/* Right: Product Count & Red Chevron */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-neutral-600">
          <span>{category.productCount} Products</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#D62828]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#D62828]" />
          )}
        </div>
      </button>

      {/* Expanded Table Content */}
      {isExpanded && category.products && category.products.length > 0 && (
        <div id={`cat-content-${category.id}`} className="bg-white">
          {/* DESKTOP & TABLET TABLE (Visible sm and up) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                  <th className="py-3 px-3 sm:px-4 text-center w-12 text-neutral-400">#</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700">Product</th>
                  {/* Market Rate: Desktop 1440px only */}
                  <th className="hidden lg:table-cell py-3 px-4 font-semibold text-neutral-700 w-32">
                    Market Rate
                  </th>
                  <th className="py-3 px-4 font-semibold text-[#D62828] w-28">Our Rate</th>
                  <th className="py-3 px-4 font-semibold text-neutral-700 w-28 text-center">
                    Quantity
                  </th>
                  <th className="py-3 px-4 sm:px-6 font-semibold text-neutral-700 w-28 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
                {category.products.map((prod, idx) => {
                  const qty = quantities[prod.id] ?? 0;
                  const lineAmount = qty * prod.selling_rate;
                  const isSelected = prod.id === selectedProductId;
                  const serialNum = prod.serial_number ?? idx + 1;

                  return (
                    <tr
                      key={prod.id}
                      className={cn(
                        "transition-colors hover:bg-neutral-50/80 group",
                        isSelected && "bg-[#FFF5F5] hover:bg-[#FFEBEB]"
                      )}
                    >
                      {/* Serial Number */}
                      <td
                        className={cn(
                          "py-3.5 px-3 sm:px-4 text-center font-medium",
                          isSelected ? "text-[#D62828] font-bold" : "text-neutral-500"
                        )}
                      >
                        {serialNum}
                      </td>

                      {/* Product Image & Names */}
                      <td
                        className="py-3.5 px-4 cursor-pointer"
                        onClick={() => onProductClick(prod)}
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded bg-white p-0.5 border border-neutral-100 shadow-2xs">
                            <Image
                              src={prod.image_url || DEFAULT_FALLBACK_IMAGE}
                              alt={prod.name}
                              fill
                              sizes="44px"
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 group-hover:text-red-600 transition-colors">
                              {prod.name}
                            </div>
                            {prod.tamil_name && (
                              <div className="text-xs text-neutral-500 font-medium">
                                {prod.tamil_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Market Rate (Desktop Only) */}
                      <td className="hidden lg:table-cell py-3.5 px-4 text-neutral-400 line-through">
                        {prod.market_rate && prod.market_rate > prod.selling_rate
                          ? `₹ ${prod.market_rate.toFixed(2)}`
                          : "—"}
                      </td>

                      {/* Our Rate (Red) */}
                      <td className="py-3.5 px-4 font-bold text-[#D62828] whitespace-nowrap">
                        ₹ {prod.selling_rate.toFixed(2)}
                      </td>

                      {/* Quantity Input */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={qty}
                          onChange={(e) => handleQtyInput(prod.id, e)}
                          aria-label={`Quantity for ${prod.name}`}
                          className={cn(
                            "w-16 h-8 text-center border border-neutral-300 rounded text-xs sm:text-sm font-semibold text-neutral-900 transition-colors",
                            "focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600",
                            qty > 0 && "border-red-400 bg-white"
                          )}
                        />
                      </td>

                      {/* Amount */}
                      <td
                        className={cn(
                          "py-3.5 px-4 sm:px-6 text-right font-bold whitespace-nowrap",
                          isSelected || qty > 0 ? "text-[#D62828]" : "text-neutral-900"
                        )}
                      >
                        ₹ {lineAmount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS (Visible under 640px) */}
          <div className="sm:hidden divide-y divide-neutral-100 p-2 space-y-1">
            {category.products.map((prod, idx) => {
              const qty = quantities[prod.id] ?? 0;
              const lineAmount = qty * prod.selling_rate;
              const isSelected = prod.id === selectedProductId;
              const serialNum = prod.serial_number ?? idx + 1;

              return (
                <div
                  key={prod.id}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                    isSelected ? "bg-[#FFF5F5]" : "hover:bg-neutral-50"
                  )}
                >
                  {/* Left: Serial + Image + Names + Our Rate */}
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 pr-2"
                    onClick={() => onProductClick(prod)}
                  >
                    <span
                      className={cn(
                        "text-xs font-bold w-4 text-center shrink-0",
                        isSelected ? "text-[#D62828]" : "text-neutral-500"
                      )}
                    >
                      {serialNum}
                    </span>

                    <div className="relative w-11 h-11 shrink-0 rounded bg-white p-0.5 border border-neutral-100 shadow-2xs">
                      <Image
                        src={prod.image_url || DEFAULT_FALLBACK_IMAGE}
                        alt={prod.name}
                        fill
                        sizes="44px"
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-neutral-900 truncate">
                        {prod.name}
                      </h3>
                      {prod.tamil_name && (
                        <p className="text-[11px] text-neutral-500 truncate">
                          {prod.tamil_name}
                        </p>
                      )}
                      <p className="text-xs font-bold text-[#D62828] mt-0.5">
                        ₹ {prod.selling_rate.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quantity Box + Amount */}
                  <div className="flex flex-col items-end space-y-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={qty}
                      onChange={(e) => handleQtyInput(prod.id, e)}
                      aria-label={`Quantity for ${prod.name}`}
                      className="w-14 h-8 text-center border border-neutral-300 rounded text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 bg-white"
                    />
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isSelected || qty > 0 ? "text-[#D62828]" : "text-neutral-900"
                      )}
                    >
                      ₹ {lineAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
