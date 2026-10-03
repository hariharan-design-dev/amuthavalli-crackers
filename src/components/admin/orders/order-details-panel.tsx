"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  User,
  FileText,
  Package,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { AdminOrder, AdminOrderItem, AdminOrderStatus } from "@/types/admin-order";
import { OrderEditModal } from "@/components/admin/orders/order-edit-modal";

interface OrderDetailsPanelProps {
  order: AdminOrder;
  onClose?: () => void;
  isMobileModal?: boolean;
  loadingItems?: boolean;
  onOrderUpdated?: (order: AdminOrder) => void;
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

export function OrderDetailsPanel({
  order,
  onClose,
  isMobileModal = false,
  loadingItems = false,
  onOrderUpdated,
}: OrderDetailsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isEditable = order.status !== "Completed" && order.status !== "Cancelled";

  const handleCopyMobile = () => {
    navigator.clipboard.writeText(order.customer_phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrderSaved = (updatedOrder: AdminOrder) => {
    if (onOrderUpdated) {
      onOrderUpdated(updatedOrder);
    }
  };

  const items: AdminOrderItem[] = order.items ?? [];

  return (
    <div
      className={`bg-white flex flex-col ${
        isMobileModal
          ? "w-full max-h-[90vh] rounded-t-2xl shadow-2xl overflow-y-auto"
          : "w-80 xl:w-96 rounded-xl border border-neutral-200/80 shadow-2xs shrink-0"
      }`}
    >
      {/* Mobile Top Drag Indicator */}
      {isMobileModal && (
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2.5 mb-1" />
      )}

      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm sm:text-base font-bold text-neutral-900">
            Order Details
          </h3>
          {isEditable && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-[#0B3B32] border border-emerald-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              title="Edit this order bill"
            >
              <Pencil className="w-3 h-3 text-[#0B3B32]" />
              <span>Edit</span>
            </button>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
            aria-label="Close order details"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-5 overflow-y-auto">
        {/* 2. Order Header Card */}
        <div className="flex items-center space-x-3 bg-neutral-50/70 p-3 rounded-xl border border-neutral-100">
          <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center font-bold text-base shrink-0">
            <Clock className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-red-600 truncate">
                {order.order_number}
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {order.created_at_display}
            </p>
          </div>
        </div>

        {/* 3. Customer Details (Historical snapshot — authoritative schema fields only) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Customer Details</span>
            </div>
            {isEditable && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs">
            <div>
              <span className="text-neutral-400 block text-[11px]">Name</span>
              <span className="font-semibold text-neutral-800 block mt-0.5">
                {order.customer_name}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Mobile</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-semibold text-neutral-800">
                  {order.customer_phone}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMobile}
                  className="text-neutral-400 hover:text-neutral-700 p-0.5"
                  title="Copy Phone"
                  aria-label="Copy customer phone"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-neutral-400 block text-[11px]">Address</span>
              <span className="font-semibold text-neutral-800 block mt-0.5 leading-relaxed">
                {order.customer_address}
              </span>
            </div>

            {order.customer_city && (
              <div>
                <span className="text-neutral-400 block text-[11px]">City</span>
                <span className="font-semibold text-neutral-800 block mt-0.5">
                  {order.customer_city}
                </span>
              </div>
            )}

            {order.customer_pincode && (
              <div>
                <span className="text-neutral-400 block text-[11px]">Pincode</span>
                <span className="font-semibold text-neutral-800 block mt-0.5">
                  {order.customer_pincode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Order Information (Strictly supported information) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center border-b border-neutral-100 pb-2">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Order Information</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Total Items</span>
              <span className="font-semibold text-neutral-800">
                {order.items_count} distinct items
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Total Quantity</span>
              <span className="font-semibold text-neutral-800">
                {order.total_quantity}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Order Status</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
              <span className="text-sm font-bold text-neutral-900">Order Total</span>
              <span className="text-sm sm:text-base font-black text-red-600">
                ₹{" "}
                {order.total_amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {order.notes && (
              <div className="pt-2 bg-neutral-50/70 p-2.5 rounded-lg border border-neutral-100">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-0.5">
                  Order Notes
                </span>
                <p className="text-neutral-700 text-xs italic">
                  &ldquo;{order.notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 5. Order Items */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              <span>Order Items ({loadingItems ? "…" : items.length})</span>
            </div>
          </div>

          {loadingItems ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-neutral-400 animate-spin mr-2" />
              <span className="text-xs text-neutral-400">Loading items…</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4">
              No items found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-neutral-50/60 rounded-lg border border-neutral-100 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h5 className="font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </h5>
                    <div className="text-[11px] text-neutral-500 flex items-center space-x-2 mt-0.5">
                      <span>
                        ₹{item.unit_price.toFixed(2)} × {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 block">
                      ₹{item.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Invoice Actions */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Actions &amp; Invoice</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {isEditable && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="w-full inline-flex items-center justify-center space-x-1.5 bg-[#0B3B32] hover:bg-[#072C24] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Order Bill</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/invoice/${order.invoice_token}`}
                target="_blank"
                className="inline-flex items-center justify-center space-x-1.5 bg-[#D62828] hover:bg-[#B71C1C] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Invoice</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/invoice/${order.invoice_token}`;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center justify-center space-x-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editModalOpen && (
        <OrderEditModal
          key={order.id}
          order={order}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleOrderSaved}
        />
      )}
    </div>
  );
}
