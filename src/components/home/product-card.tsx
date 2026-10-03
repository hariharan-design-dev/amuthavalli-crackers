"use client";

import React from "react";
import Image from "next/image";
import type { HomeProductItem } from "@/lib/data/home-data";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: HomeProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, setQuantity } = useCart();
  const quantity = items[product.id] ?? 0;

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newQty = isNaN(val) || val < 0 ? 0 : Math.min(val, 1000);
    setQuantity(product.id, newQty);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-3 sm:p-4 flex flex-col justify-between group relative">
      {/* Product Image */}
      <div className="relative w-full h-28 sm:h-32 my-1 flex items-center justify-center">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 200px"
          className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Product Information */}
      <div className="mt-2 space-y-0.5">
        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-neutral-500 font-medium">
          {product.category}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-xs sm:text-sm font-extrabold text-[#D62828]">
            ₹ {product.ourRate}
          </span>
          {product.marketRate && (
            <span className="text-[11px] sm:text-xs text-neutral-400 line-through">
              ₹ {product.marketRate}
            </span>
          )}
        </div>
      </div>

      {/* APPROVED Interaction: Manually typed quantity, auto cart update, NO +/- and NO Add button, NO wishlist */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
        <label
          htmlFor={`home-qty-${product.id}`}
          className="text-[11px] sm:text-xs font-semibold text-neutral-600 shrink-0"
        >
          Qty:
        </label>
        <input
          id={`home-qty-${product.id}`}
          type="number"
          min="0"
          max="1000"
          placeholder="0"
          value={quantity === 0 ? "" : quantity}
          onChange={handleQtyChange}
          aria-label={`Enter quantity for ${product.name}`}
          className={cn(
            "w-20 sm:w-24 h-8 text-center border rounded-lg text-xs sm:text-sm font-semibold transition-all",
            "focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600",
            quantity > 0
              ? "border-red-500 bg-red-50/30 text-[#D62828] font-bold"
              : "border-neutral-300 text-neutral-900 bg-neutral-50/50 hover:border-neutral-400"
          )}
        />
      </div>
    </div>
  );
}
