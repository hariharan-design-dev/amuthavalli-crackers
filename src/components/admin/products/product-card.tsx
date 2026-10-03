"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  type AdminProduct,
  getProductDisplayStatus,
  type ProductDisplayStatus,
} from "@/types/admin-product";

interface ProductCardProps {
  product: AdminProduct;
  onEdit: (product: AdminProduct) => void;
  onDelete: (productId: string) => void;
  onToggleAvailability: (productId: string, currentAvailable: boolean) => void;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getProductDisplayStatus(product);

  const getStatusBadge = (s: ProductDisplayStatus) => {
    switch (s) {
      case "In Stock":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Low Stock":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Out of Stock":
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP & TABLET VIEW: Vertical Card Grid (2 cols on tablet, 5 on desktop) */}
      {/* ========================================================================= */}
      <div
        onClick={() => onEdit(product)}
        className="hidden sm:flex flex-col bg-white rounded-xl border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all p-3 sm:p-3.5 cursor-pointer relative group"
      >
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-neutral-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-3 border border-neutral-100">
          {product.image_url ? (
            <div className="relative w-full h-full">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1440px) 20vw, 250px"
                className="object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="text-neutral-300 text-xs font-medium">No Image</div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight line-clamp-1 group-hover:text-[#0D7A4D] transition-colors">
              {product.name}
            </h3>

            {product.tamil_name && (
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5 line-clamp-1">
                {product.tamil_name}
              </p>
            )}

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-sm sm:text-base font-black text-neutral-900">
                ₹ {product.selling_rate.toFixed(2)}
              </span>
              {product.market_rate && product.market_rate > product.selling_rate && (
                <span className="text-[11px] text-neutral-400 line-through">
                  ₹ {product.market_rate.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Row: Status Badge & Action Menu */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                status
              )}`}
            >
              {status}
            </span>

            {/* Action Dropdown Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-500 transition-colors"
                aria-label="Product actions"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Action Dropdown Menu */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-40 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(product);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center space-x-2 text-neutral-700"
                    >
                      <Edit className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleAvailability(product.id, product.is_available);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center space-x-2 text-neutral-700"
                    >
                      {product.is_available ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mark Unavailable</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Mark Available</span>
                        </>
                      )}
                    </button>
                    <div className="my-1 border-t border-neutral-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(product.id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (375px): Horizontal Card Layout matching Mobile Reference   */}
      {/* ========================================================================= */}
      <div
        onClick={() => onEdit(product)}
        className="flex sm:hidden items-center bg-white rounded-xl border border-neutral-200/90 p-3 shadow-2xs active:bg-neutral-50 transition-all cursor-pointer relative"
      >
        {/* Left Square Thumbnail */}
        <div className="relative w-18 h-18 bg-neutral-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 border border-neutral-100 mr-3">
          {product.image_url ? (
            <div className="relative w-full h-full">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="text-[10px] text-neutral-400">No Image</div>
          )}
        </div>

        {/* Center Details */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-xs font-bold text-neutral-900 truncate">
            {product.name}
          </h3>

          {product.tamil_name && (
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5 truncate">
              {product.tamil_name}
            </p>
          )}

          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xs font-black text-neutral-900">
              ₹ {product.selling_rate.toFixed(2)}
            </span>
            {product.market_rate && product.market_rate > product.selling_rate && (
              <span className="text-[10px] text-neutral-400 line-through">
                ₹ {product.market_rate.toFixed(2)}
              </span>
            )}
          </div>

          <div className="mt-1.5">
            <span
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border inline-block ${getStatusBadge(
                status
              )}`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Right Action Menu */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            aria-label="Product actions"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-3 top-12 w-36 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(product);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center space-x-2 text-neutral-700"
                >
                  <Edit className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Edit Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleAvailability(product.id, product.is_available);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-50 flex items-center space-x-2 text-neutral-700"
                >
                  {product.is_available ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mark Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mark Available</span>
                    </>
                  )}
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(product.id);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
