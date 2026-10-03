import React from "react";
import Link from "next/link";
import { Clock, ChevronRight, ChevronLeft, FileText } from "lucide-react";
import type { AdminOrder, AdminOrderStatus } from "@/types/admin-order";

interface OrderListMobileProps {
  orders: AdminOrder[];
  onSelectOrder: (order: AdminOrder) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
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

export function OrderListMobile({
  orders,
  onSelectOrder,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  loading = false,
}: OrderListMobileProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-3">
      {/* Order Cards List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs space-y-2.5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-neutral-200 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-neutral-200 rounded w-24" />
                    <div className="h-2.5 bg-neutral-100 rounded w-28" />
                  </div>
                </div>
              </div>
              <div className="pl-9 space-y-1.5">
                <div className="h-3 bg-neutral-200 rounded w-32" />
                <div className="h-2.5 bg-neutral-100 rounded w-24" />
              </div>
              <div className="pl-9 flex items-center justify-between pt-1 border-t border-neutral-100">
                <div className="h-3 bg-neutral-200 rounded w-28" />
                <div className="h-4 bg-neutral-200 rounded-full w-16" />
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs">
            No orders found.
          </div>
        ) : (
          orders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => onSelectOrder(ord)}
              className="bg-white rounded-xl border border-neutral-200/80 p-3.5 shadow-2xs space-y-2.5 active:bg-neutral-50 cursor-pointer"
            >
              {/* Row 1: Order Number, Date/Time & Chevron */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-600">
                      {ord.order_number}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {ord.created_at_display}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Link
                    href={`/invoice/${ord.invoice_token}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                    title="Open Invoice"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </Link>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                </div>
              </div>

              {/* Row 2: Customer Name & Mobile */}
              <div className="pl-9">
                <h5 className="text-xs font-bold text-neutral-900">
                  {ord.customer_name}
                </h5>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {ord.customer_phone}
                </p>
              </div>

              {/* Row 3: Items, Total Amount, Status Badge */}
              <div className="pl-9 flex items-center justify-between pt-1 border-t border-neutral-100">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {ord.items_count} items
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="font-bold text-neutral-900">
                    ₹{" "}
                    {ord.total_amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                    ord.status
                  )}`}
                >
                  {ord.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Pagination Footer */}
      <div className="pt-2 pb-6 flex items-center justify-between text-xs text-neutral-500">
        <span>
          Showing {from} to {to} of {totalCount}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center rounded-md bg-[#0D7A4D] text-white font-bold text-xs"
            >
              {page}
            </button>
            {totalPages > 1 && (
              <span className="px-0.5 text-neutral-400 text-[10px]">
                / {totalPages}
              </span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
