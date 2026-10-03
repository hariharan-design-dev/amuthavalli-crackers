"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { CustomerProductItem } from "@/lib/data/catalog";

interface ProductModalProps {
  product: CustomerProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentQuantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}

const DEFAULT_FALLBACK_IMAGE = "/images/products/gold_lakshmi.png";

export function ProductModal({
  product,
  isOpen,
  onClose,
  currentQuantity,
  onQuantityChange,
}: ProductModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleQtyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newQty = isNaN(val) || val < 0 ? 0 : Math.min(val, 1000);
    onQuantityChange(product.id, newQty);
  };

  const totalAmount = currentQuantity * product.selling_rate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-[560px] rounded-2xl bg-white p-5 sm:p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 cursor-pointer"
          aria-label="Close product details modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content Body */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Product Image */}
          <div className="relative w-32 h-36 sm:w-36 sm:h-44 shrink-0 mx-auto sm:mx-0 rounded-lg bg-neutral-50 p-2 border border-neutral-100">
            <Image
              src={product.image_url || DEFAULT_FALLBACK_IMAGE}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 128px, 144px"
              className="object-contain"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 w-full text-left">
            <h2
              id="modal-product-title"
              className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight"
            >
              {product.name}
            </h2>
            {product.tamil_name && (
              <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                {product.tamil_name}
              </p>
            )}

            {/* Pricing Section */}
            <div className="mt-3 flex items-baseline space-x-3">
              <span className="text-xl sm:text-2xl font-black text-[#D62828]">
                ₹ {product.selling_rate.toFixed(2)}
              </span>
              {product.market_rate && product.market_rate > product.selling_rate && (
                <span className="text-sm font-medium text-neutral-400 line-through">
                  ₹ {product.market_rate.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description if present */}
            {product.description && (
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-2">
                {product.description}
              </p>
            )}

            {/* Quantity Input and Line Total */}
            <div className="mt-5 pt-3 border-t border-neutral-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="modal-qty-input"
                  className="text-xs font-bold text-neutral-700 uppercase tracking-wider"
                >
                  Qty:
                </label>
                <input
                  id="modal-qty-input"
                  type="number"
                  min="0"
                  max="1000"
                  value={currentQuantity}
                  onChange={handleQtyInput}
                  className="w-20 h-9 text-center border border-neutral-300 rounded-lg text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>

              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-neutral-400">
                  Total
                </span>
                <span className="text-base sm:text-lg font-black text-[#D62828]">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#D62828] hover:bg-[#B51E1E] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
