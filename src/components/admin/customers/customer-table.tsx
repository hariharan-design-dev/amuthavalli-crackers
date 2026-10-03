"use client";

import React from "react";
import { MoreVertical, ChevronLeft, ChevronRight, ChevronDown, User } from "lucide-react";
import type { AdminCustomerRow } from "@/types/customer";

interface CustomerTableProps {
  customers: AdminCustomerRow[];
  selectedCustomerId?: string;
  onSelectCustomer: (customer: AdminCustomerRow) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  isLoading?: boolean;
}

export function CustomerTable({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: CustomerTableProps) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
      {/* Table Container */}
      <div className="overflow-x-auto flex-1 min-h-[320px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-neutral-500 font-semibold text-[11px]">
              <th className="py-3 px-3 sm:px-3.5 w-10 text-center">#</th>
              <th className="py-3 px-3">Customer Name</th>
              <th className="py-3 px-3">Mobile Number</th>
              <th className="py-3 px-3">Address</th>
              <th className="py-3 px-2 text-center">Total Orders</th>
              <th className="py-3 px-3 text-right">Total Spent (₹)</th>
              <th className="py-3 px-3">Last Order</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-3 bg-neutral-200 rounded w-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-3.5 bg-neutral-200 rounded w-28" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-3 bg-neutral-100 rounded w-24" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-3 bg-neutral-100 rounded w-32" />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <div className="h-3 bg-neutral-100 rounded w-6 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="h-3.5 bg-neutral-200 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-3 bg-neutral-100 rounded w-20" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-6 bg-neutral-100 rounded w-12 mx-auto" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-neutral-700">No customers found</p>
                    <p className="text-xs text-neutral-400 max-w-sm">
                      No customer records match your search or filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((cust, idx) => {
                const isSelected = cust.id === selectedCustomerId;
                const rowNum = (page - 1) * pageSize + idx + 1;

                return (
                  <tr
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-rose-50/40 hover:bg-rose-50/60"
                        : "hover:bg-neutral-50/80"
                    }`}
                  >
                    {/* # */}
                    <td className="py-3 px-3 sm:px-3.5 text-center text-neutral-400 font-medium text-[11px]">
                      {rowNum}
                    </td>

                    {/* Customer Name */}
                    <td className="py-3 px-3 font-bold text-neutral-900 whitespace-nowrap">
                      {cust.name}
                    </td>

                    {/* Mobile Number */}
                    <td className="py-3 px-3 text-neutral-600 whitespace-nowrap font-medium">
                      {cust.mobile}
                    </td>

                    {/* Address */}
                    <td
                      className="py-3 px-3 text-neutral-600 max-w-[140px] xl:max-w-[180px] truncate"
                      title={cust.fullAddress || cust.address}
                    >
                      {cust.city ? `${cust.address}, ${cust.city}` : cust.address}
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-2 text-center font-semibold text-neutral-800">
                      {cust.totalOrders}
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                      ₹{" "}
                      {cust.totalSpent.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Last Order */}
                    <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                      {cust.lastOrderDate || "-"}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div
                        className="inline-flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(cust)}
                          className="border border-red-500/80 hover:bg-red-50 text-red-600 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-100 transition-colors"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Pagination Footer */}
      <div className="border-t border-neutral-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-neutral-600">
        <div>
          Showing <span className="font-semibold text-neutral-900">{startItem}</span> to{" "}
          <span className="font-semibold text-neutral-900">{endItem}</span> of{" "}
          <span className="font-semibold text-neutral-900">{totalCount}</span> customers
        </div>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-neutral-400 select-none">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(Number(p))}
                className={`w-7 h-7 flex items-center justify-center rounded-md font-semibold text-xs transition-colors ${
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
            className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rows per page */}
        <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
          <span>Show</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md pl-2 pr-6 py-1 text-xs text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
}
