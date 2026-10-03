"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, Loader2, Info, Package, User } from "lucide-react";
import type { AdminOrder, AdminOrderItem } from "@/types/admin-order";
import { updateAdminOrder } from "@/actions/admin-orders";

interface OrderEditModalProps {
  order: AdminOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: AdminOrder) => void;
}

interface EditableItem {
  id: string;
  product_name: string;
  tamil_name?: string | null;
  quantity: number;
  unit_price: number;
}

export function OrderEditModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: OrderEditModalProps) {
  // Form fields initialized directly from order snapshot
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone);
  const [customerAddress, setCustomerAddress] = useState(order.customer_address);
  const [customerCity, setCustomerCity] = useState(order.customer_city ?? "");
  const [customerPincode, setCustomerPincode] = useState(order.customer_pincode ?? "");

  const [items, setItems] = useState<EditableItem[]>(() =>
    (order.items ?? []).map((item: AdminOrderItem) => ({
      id: item.id,
      product_name: item.product_name,
      tamil_name: item.tamil_name ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time calculations
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const handleItemQuantityChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: isNaN(num) ? 0 : Math.max(0, Math.min(1000, num)),
      };
      return updated;
    });
  };

  const handleItemPriceChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unit_price: isNaN(num) ? 0 : Math.max(0, num),
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Customer name must be at least 2 characters.");
      return;
    }

    const cleanPhone = customerPhone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Mobile number must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).");
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 5) {
      setErrorMessage("Customer address must be at least 5 characters.");
      return;
    }

    const cleanPincode = customerPincode.trim();
    if (cleanPincode && !/^\d{6}$/.test(cleanPincode)) {
      setErrorMessage("PIN code must be exactly 6 digits.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("The order must have at least one product item.");
      return;
    }

    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        setErrorMessage(`Quantity for "${item.product_name}" must be at least 1.`);
        return;
      }
      if (item.unit_price === undefined || item.unit_price < 0.01) {
        setErrorMessage(`Rate for "${item.product_name}" must be greater than ₹0.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        customer_address: customerAddress.trim(),
        customer_city: customerCity.trim() || null,
        customer_pincode: cleanPincode || null,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
        })),
      };

      const result = await updateAdminOrder(order.id, payload);

      if (!result.success || !result.order) {
        setErrorMessage(result.message || "Failed to update order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      onSuccess(result.order);
      onClose();
    } catch (err: unknown) {
      console.error("[OrderEditModal] Error:", err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-neutral-900">
                  Edit Order Bill
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-md">
                  {order.order_number}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Update customer snapshot &amp; negotiate rates for this specific order.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="order-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Section 1: Customer Details Snapshot */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center space-x-2 text-neutral-900 font-bold text-xs sm:text-sm">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Customer Snapshot</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                Applies to this bill only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="House / Flat no, Street, Landmark"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={customerPincode}
                  onChange={(e) => setCustomerPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit PIN"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
              <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Editing this snapshot does not alter the customer&apos;s master profile.</span>
            </div>
          </div>

          {/* Section 2: Order Items & Pricing Table */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center space-x-2 text-neutral-900 font-bold text-xs sm:text-sm">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Order Items ({items.length})</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                Line composition is locked
              </span>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 w-28 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {items.map((item, idx) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 text-center text-neutral-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-neutral-800 block">
                            {item.product_name}
                          </span>
                          {item.tamil_name && (
                            <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                              {item.tamil_name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                            className="w-20 text-center bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs text-neutral-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <span className="text-neutral-400 font-medium text-xs">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min={0.01}
                              value={item.unit_price === 0 ? "" : item.unit_price}
                              onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                              className="w-24 text-right bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs text-neutral-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-neutral-900 whitespace-nowrap">
                          ₹ {lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Recalculated Bill Totals Bar */}
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
              <div className="flex items-center space-x-4 text-neutral-600 font-medium">
                <div>
                  Total Line Items: <span className="font-bold text-neutral-900">{items.length}</span>
                </div>
                <div>
                  Total Quantity: <span className="font-bold text-neutral-900">{totalQuantity}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-right">
                <span className="text-xs font-semibold text-neutral-600">Recalculated Bill Total:</span>
                <span className="text-base font-black text-red-600">
                  ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Action Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="order-edit-form"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-1.5 bg-[#0B3B32] hover:bg-[#072C24] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
