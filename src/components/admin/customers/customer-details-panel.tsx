"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  IndianRupee,
  Calendar,
  Phone,
  Edit2,
  Copy,
  Check,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import type { AdminCustomerRow, CustomerOrderHistoryItem, OrderStatus } from "@/types/customer";

interface CustomerDetailsPanelProps {
  customer: AdminCustomerRow;
  orderHistory?: CustomerOrderHistoryItem[];
  isHistoryLoading?: boolean;
  onClose?: () => void;
  onEditCustomer?: (customer: AdminCustomerRow) => void;
  isMobileModal?: boolean;
}

export function CustomerDetailsPanel({
  customer,
  orderHistory = [],
  isHistoryLoading = false,
  onClose,
  onEditCustomer,
  isMobileModal = false,
}: CustomerDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMobile = () => {
    navigator.clipboard.writeText(customer.mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "Processing":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const initial = customer.name.charAt(0).toUpperCase();

  return (
    <div
      className={`bg-white flex flex-col ${
        isMobileModal
          ? "w-full max-h-[88vh] rounded-t-2xl shadow-2xl overflow-y-auto"
          : "w-80 xl:w-96 rounded-xl border border-neutral-200/80 shadow-2xs shrink-0"
      }`}
    >
      {/* Mobile Top Drag Indicator */}
      {isMobileModal && (
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2.5 mb-1" />
      )}

      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900">
          Customer Details
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-5 overflow-y-auto">
        {/* 2. Customer Identity Banner (Status badge removed per locked requirements) */}
        <div className="flex items-center space-x-3 bg-neutral-50/60 p-3 rounded-xl border border-neutral-100">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${customer.avatarColor}`}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-neutral-900 truncate">
              {customer.name}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {customer.mobile}
            </p>
          </div>
        </div>

        {/* 3. Three Stat Boxes */}
        <div className="grid grid-cols-3 gap-2">
          {/* Total Orders */}
          <div className="bg-neutral-50/70 border border-neutral-100 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center text-red-500 mb-1">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 block leading-tight">
              {customer.totalOrders}
            </span>
            <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
              Total Orders
            </span>
          </div>

          {/* Total Spent */}
          <div className="bg-neutral-50/70 border border-neutral-100 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center text-amber-500 mb-1">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 block leading-tight truncate">
              ₹ {customer.totalSpent.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
              Total Spent
            </span>
          </div>

          {/* Last Order */}
          <div className="bg-neutral-50/70 border border-neutral-100 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center text-red-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-neutral-900 block leading-tight truncate">
              {customer.lastOrderDate || "-"}
            </span>
            <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
              Last Order
            </span>
          </div>
        </div>

        {/* 4. Contact Information (Only supported fields: Name, Mobile, Address, City, Pincode) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>Contact Information</span>
            </div>
            {onEditCustomer && (
              <button
                type="button"
                onClick={() => onEditCustomer(customer)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs font-semibold cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs">
            <div>
              <span className="text-neutral-400 block text-[11px]">Name</span>
              <span className="font-semibold text-neutral-800 block mt-0.5">
                {customer.name}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Mobile Number</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-semibold text-neutral-800">
                  {customer.mobile}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMobile}
                  className="text-neutral-400 hover:text-neutral-700 p-0.5"
                  title="Copy Mobile"
                  aria-label="Copy mobile number"
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
                {customer.address}
              </span>
            </div>

            {customer.city && (
              <div>
                <span className="text-neutral-400 block text-[11px]">City / Town</span>
                <span className="font-semibold text-neutral-800 block mt-0.5">
                  {customer.city}
                </span>
              </div>
            )}

            {customer.pincode && (
              <div>
                <span className="text-neutral-400 block text-[11px]">Pincode</span>
                <span className="font-semibold text-neutral-800 block mt-0.5">
                  {customer.pincode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Order History */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center space-x-1.5 text-neutral-900 font-bold text-xs sm:text-sm">
              <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
              <span>Order History ({customer.totalOrders})</span>
            </div>
          </div>

          {isHistoryLoading ? (
            <div className="py-6 flex items-center justify-center space-x-2 text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              <span>Loading orders...</span>
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="py-6 text-center text-neutral-400">
              <ShoppingBag className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
              <p className="text-xs font-medium text-neutral-600">No orders placed yet</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                This customer has not placed any orders yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] uppercase">
                    <th className="py-1.5 font-medium">#</th>
                    <th className="py-1.5 font-medium">Order Number</th>
                    <th className="py-1.5 font-medium">Date</th>
                    <th className="py-1.5 font-medium text-right">Amount</th>
                    <th className="py-1.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orderHistory.map((order, idx) => (
                    <tr key={order.id || order.orderNumber} className="hover:bg-neutral-50/50">
                      <td className="py-2 text-neutral-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2 font-semibold text-red-600 text-[11px]">
                        {order.orderNumber}
                      </td>
                      <td className="py-2 text-neutral-600 text-[11px]">
                        {order.date}
                      </td>
                      <td className="py-2 font-bold text-neutral-800 text-[11px] text-right whitespace-nowrap">
                        ₹ {order.amount.toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
