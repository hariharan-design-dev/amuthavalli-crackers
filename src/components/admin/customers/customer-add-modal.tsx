"use client";

import React, { useState } from "react";
import { X, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { createAdminCustomer } from "@/actions/admin-customers";
import type { AdminCustomerRow } from "@/types/customer";

interface CustomerAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: AdminCustomerRow) => void;
}

export function CustomerAddModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomerAddModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setName("");
    setMobile("");
    setAddress("");
    setCity("");
    setPincode("");
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend checks
    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }
    const cleanPhone = mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      setError("Pincode must be 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await createAdminCustomer({
        name: name.trim(),
        mobile: cleanPhone,
        address: address.trim(),
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setError(res.message || "Failed to create customer.");
        return;
      }

      handleReset();
      onSuccess(res.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                Add New Customer
              </h2>
              <p className="text-xs text-neutral-500">
                Create a standalone customer record in database.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 border border-red-200/80 text-red-700 text-xs p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Mobile Number (10 digits) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door no, Street name, Locality"
              className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* City & Pincode Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Madurai"
                className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="625020"
                className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 bg-[#D62828] hover:bg-[#B71C1C] text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Creating..." : "Save Customer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
