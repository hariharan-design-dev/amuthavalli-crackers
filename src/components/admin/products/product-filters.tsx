"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Filter, X } from "lucide-react";
import type { AdminCategory } from "@/types/admin-product";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
  categories: AdminCategory[];
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  onClearFilters,
  categories,
}: ProductFiltersProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "latest";

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-3 sm:p-3.5 shadow-2xs space-y-3">
      {/* Primary Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-neutral-50/60 hover:bg-neutral-50 focus:bg-white border border-neutral-200/90 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0D7A4D]/20 focus:border-[#0D7A4D] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop / Tablet Filters Row */}
        <div className="hidden sm:flex items-center space-x-2.5">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="appearance-none bg-neutral-50/60 hover:bg-neutral-50 border border-neutral-200/90 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:border-[#0D7A4D] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="appearance-none bg-neutral-50/60 hover:bg-neutral-50 border border-neutral-200/90 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:border-[#0D7A4D] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <span className="text-xs text-neutral-500 mr-2 whitespace-nowrap hidden lg:inline">
              Sort by
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="appearance-none bg-neutral-50/60 hover:bg-neutral-50 border border-neutral-200/90 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:border-[#0D7A4D] cursor-pointer"
              >
                <option value="latest">Latest Added</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`flex-1 inline-flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              mobileFilterOpen || hasActiveFilters
                ? "bg-[#0D7A4D]/10 border-[#0D7A4D] text-[#0D7A4D]"
                : "bg-white border-neutral-200 text-neutral-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters &amp; Sort</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#0D7A4D]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-semibold text-red-600 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Expandable Filter Options */}
      {mobileFilterOpen && (
        <div className="sm:hidden pt-2.5 border-t border-neutral-100 grid grid-cols-2 gap-2">
          {/* Category */}
          <div className="relative col-span-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700"
            >
              <option value="all">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full appearance-none bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-neutral-700"
            >
              <option value="latest">Latest Added</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 bottom-2.5 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
