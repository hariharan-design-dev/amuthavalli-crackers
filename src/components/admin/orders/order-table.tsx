import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, FileText } from "lucide-react";
import type { AdminOrder, AdminOrderStatus } from "@/types/admin-order";

interface OrderTableProps {
  orders: AdminOrder[];
  selectedOrderId?: string;
  onSelectOrder: (order: AdminOrder) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  loading?: boolean;
}

function getStatusBadge(status: AdminOrderStatus): string {
  switch (status) {
    case "New":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Confirmed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Processing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Completed":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

function buildPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (currentPage > 3) pages.push("...");
  for (
    let p = Math.max(2, currentPage - 1);
    p <= Math.min(totalPages - 1, currentPage + 1);
    p++
  ) {
    pages.push(p);
  }
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export function OrderTable({
  orders,
  selectedOrderId,
  onSelectOrder,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: OrderTableProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-neutral-500 font-semibold text-[11px]">
              <th className="py-3 px-3 sm:px-3.5 w-10 text-center">#</th>
              <th className="py-3 px-3">Order Number</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Date &amp; Time</th>
              <th className="py-3 px-2 text-center">Items</th>
              <th className="py-3 px-3 text-right">Total Amount</th>
              <th className="py-3 px-2 text-center">Order Status</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-3 sm:px-3.5">
                    <div className="h-3 bg-neutral-200 rounded w-4 mx-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-neutral-200 rounded w-24" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-neutral-200 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-neutral-100 rounded w-20" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-neutral-200 rounded w-32" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="h-3 bg-neutral-200 rounded w-6 mx-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-neutral-200 rounded w-16 ml-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="h-5 bg-neutral-200 rounded-full w-16 mx-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-6 bg-neutral-200 rounded w-12 mx-auto" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-neutral-400 text-xs">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord, idx) => {
                const isSelected = ord.id === selectedOrderId;
                const rowNumber = (page - 1) * pageSize + idx + 1;

                return (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-rose-50/40 hover:bg-rose-50/60"
                        : "hover:bg-neutral-50/80"
                    }`}
                  >
                    {/* # */}
                    <td className="py-3 px-3 sm:px-3.5 text-center text-neutral-400 font-medium text-[11px]">
                      {rowNumber}
                    </td>

                    {/* Order Number */}
                    <td className="py-3 px-3 font-bold text-red-600 whitespace-nowrap">
                      {ord.order_number}
                    </td>

                    {/* Customer (Name + Phone) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-neutral-900 block">
                        {ord.customer_name}
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        {ord.customer_phone}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                      {ord.created_at_display}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-2 text-center font-semibold text-neutral-800">
                      {ord.items_count}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                      ₹{" "}
                      {ord.total_amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Order Status */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div
                        className="inline-flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectOrder(ord)}
                          className="border border-red-500/80 hover:bg-red-50 text-red-600 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        >
                          View
                        </button>
                        <Link
                          href={`/invoice/${ord.invoice_token}`}
                          target="_blank"
                          className="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors inline-flex items-center space-x-1"
                          title="Open Official Invoice"
                        >
                          <FileText className="w-3 h-3 text-neutral-500" />
                          <span>Invoice</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-neutral-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-neutral-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-neutral-900">{from}</span> to{" "}
          <span className="font-semibold text-neutral-900">{to}</span> of{" "}
          <span className="font-semibold text-neutral-900">{totalCount}</span>{" "}
          orders
        </div>

        {/* Page Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(Number(p))}
                  className={`w-7 h-7 flex items-center justify-center rounded-md font-medium ${
                    p === page
                      ? "bg-[#0D7A4D] text-white font-bold"
                      : "hover:bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rows per page */}
        <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
          <span>Show</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md pl-2 pr-6 py-1 text-xs text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
}
