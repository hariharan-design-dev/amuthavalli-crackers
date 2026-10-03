"use client";

import React from "react";
import { Search, ChevronDown, Filter } from "lucide-react";

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  timeFilter: string;
  onTimeFilterChange: (val: string) => void;
  onClearFilters: () => void;
}

export function CustomerFilters({
  searchQuery,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  onClearFilters,
}: CustomerFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-3 sm:p-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, mobile number, or address..."
            className="w-full bg-neutral-50/80 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200/90 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
          />
        </div>

        {/* Dropdowns & Action */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Time Filter Dropdown */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => onTimeFilterChange(e.target.value)}
              className="appearance-none bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/90 rounded-lg pl-3 pr-7 py-2 text-xs sm:text-sm font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer transition-colors"
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mobile Filter Funnel Icon */}
          <button
            type="button"
            className="sm:hidden p-2 rounded-lg border border-neutral-200/90 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 focus:outline-none"
            aria-label="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Clear Filters (Desktop/Tablet) */}
          <button
            type="button"
            onClick={onClearFilters}
            className="hidden sm:inline-flex items-center text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-1 py-1"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
