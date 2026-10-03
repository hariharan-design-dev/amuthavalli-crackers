"use client";

import React from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import type { AdminCustomerRow } from "@/types/customer";

interface CustomerListMobileProps {
  customers: AdminCustomerRow[];
  onSelectCustomer: (customer: AdminCustomerRow) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function CustomerListMobile({
  customers,
  onSelectCustomer,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  isLoading = false,
}: CustomerListMobileProps) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate mobile page buttons
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 2) pages.push("...");
      if (page > 1 && page < totalPages) pages.push(page);
      if (page < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-3">
      {/* Customer Cards List */}
      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`m-skel-${i}`}
              className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs flex items-center space-x-3 animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-neutral-200 rounded w-28" />
                <div className="h-3 bg-neutral-100 rounded w-20" />
                <div className="h-2.5 bg-neutral-100 rounded w-32" />
              </div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200/80 p-8 text-center">
            <User className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-700">No customers found</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          customers.map((cust) => {
            const initial = cust.name.charAt(0).toUpperCase();

            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs flex items-center justify-between space-x-3 active:bg-neutral-50 cursor-pointer"
              >
                {/* Left: Avatar Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${cust.avatarColor}`}
                >
                  {initial}
                </div>

                {/* Middle: Name, Phone, Address */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-neutral-900 truncate">
                    {cust.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {cust.mobile}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {cust.city ? `${cust.address}, ${cust.city}` : cust.address}
                  </p>
                </div>

                {/* Right: Orders, Total, View Action (Status badge removed) */}
                <div className="flex flex-col items-end shrink-0 space-y-1">
                  <span className="text-[11px] text-neutral-500">
                    {cust.totalOrders} {cust.totalOrders === 1 ? "order" : "orders"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 whitespace-nowrap">
                    ₹{" "}
                    {cust.totalSpent.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(cust);
                      }}
                      className="border border-red-500 hover:bg-red-50 text-red-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-md transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Mobile Pagination Footer */}
      <div className="pt-2 pb-6 flex items-center justify-between text-xs text-neutral-500">
        <span>
          Showing {startItem} to {endItem} of {totalCount}
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`m-dots-${idx}`} className="px-0.5 text-neutral-400 select-none">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`m-page-${p}`}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(Number(p))}
                className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs transition-colors ${
                  isCurrent
                    ? "bg-[#D62828] text-white"
                    : "hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
