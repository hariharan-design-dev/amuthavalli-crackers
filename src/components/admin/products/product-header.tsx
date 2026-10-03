"use client";

import React from "react";
import { Plus, UploadCloud } from "lucide-react";

interface ProductHeaderProps {
  onAddProduct: () => void;
  onImportExcel: () => void;
}

export function ProductHeader({ onAddProduct, onImportExcel }: ProductHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Products
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Manage your product catalogue. Click on a product card to view or edit details.
        </p>
      </div>

      {/* Action Buttons: Desktop inline, Mobile full-width stacked */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center justify-center space-x-1.5 bg-[#0B3B32] hover:bg-[#072C24] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 sm:py-2 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>

        <button
          type="button"
          onClick={onImportExcel}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-neutral-50 text-[#0B3B32] border border-[#0B3B32]/40 hover:border-[#0B3B32] font-semibold text-xs sm:text-sm px-4 py-2.5 sm:py-2 rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Excel</span>
        </button>
      </div>
    </div>
  );
}
