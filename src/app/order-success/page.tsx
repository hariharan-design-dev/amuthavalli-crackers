"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  ShoppingBag,
  User,
  CreditCard,
  Copy,
  Check,
  Truck,
  Info,
  ArrowRight,
  Printer,
  MessageCircle,
} from "lucide-react";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import type { SafeOrder, SafeBusinessSettings } from "@/types/order";
import { getWhatsAppShareUrl } from "@/lib/order/whatsapp";

const emptySubscribe = () => () => {};
const SSR_SENTINEL = "__SSR__";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  try {
    return sessionStorage.getItem("amu_last_order");
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return SSR_SENTINEL;
}

export default function OrderSuccessPage() {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const hasRedirectedRef = React.useRef(false);

  const rawOrder = useSyncExternalStore(
    typeof window !== "undefined" ? subscribe : emptySubscribe,
    getSnapshot,
    getServerSnapshot
  );

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  );

  const { order, business } = useMemo(() => {
    if (!rawOrder || rawOrder === SSR_SENTINEL) return { order: null, business: null };
    try {
      const parsed = JSON.parse(rawOrder);
      return {
        order: (parsed.order as SafeOrder) ?? null,
        business: (parsed.business as SafeBusinessSettings) ?? null,
      };
    } catch (e) {
      console.error("[OrderSuccess] Error parsing order from sessionStorage:", e);
      return { order: null, business: null };
    }
  }, [rawOrder]);

  const handleCopyUpi = (upiId: string) => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const invoiceToken = order?.invoiceToken || order?.id;
  const invoiceUrl = origin && invoiceToken ? `${origin}/invoice/${invoiceToken}` : "";

  const whatsappTargetNumber = business?.whatsappNumber || "9655965026";
  const whatsappUrl = order
    ? getWhatsAppShareUrl(
        whatsappTargetNumber,
        order,
        business ?? undefined,
        invoiceUrl || undefined
      )
    : "";

  // 3-4 second automatic WhatsApp redirect timer
  React.useEffect(() => {
    if (!order || !whatsappUrl || hasRedirectedRef.current) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            window.location.href = whatsappUrl;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [order, whatsappUrl]);

  if (rawOrder === SSR_SENTINEL) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans">
        <TopInfoBar />
        <CustomerHeader totalItems={0} totalAmount={0} />
        <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="text-center text-neutral-500">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading your order details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans">
        <TopInfoBar />
        <CustomerHeader totalItems={0} totalAmount={0} />
        <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-8 text-center">
            <div className="w-14 h-14 bg-red-50 text-[#D62828] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">No Recent Order Found</h1>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              We couldn&apos;t find an order from your current session. Please explore our catalog to place your festive cracker order!
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#B71C1C] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const upiId = "amudhavalliatp@axl";

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900 print:bg-white">
      {/* 1. Header (Hidden on Print) */}
      <div className="print:hidden">
        <TopInfoBar />
        <CustomerHeader totalItems={0} totalAmount={0} />
      </div>

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ================================================================ */}
        {/* BANNER: ORDER PLACED SUCCESSFULLY                               */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-r from-red-50/60 via-amber-50/40 to-white rounded-2xl border border-red-100 shadow-2xs p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#16A34A] text-white rounded-full flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-[#D62828] uppercase tracking-wider">
                  ORDER PLACED SUCCESSFULLY!
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 mt-0.5">
                  Thank You for Your Order!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
                  Your order has been received. Please complete the payment as per the details below.
                  We will confirm your order once the payment is received.
                </p>

                {countdown !== null && countdown > 0 && (
                  <div className="mt-3 inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <div className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
                    <span>Redirecting to WhatsApp in {countdown} second{countdown > 1 ? "s" : ""}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Festive fireworks decoration */}
            <div className="hidden md:flex items-center justify-end opacity-85 shrink-0 select-none pointer-events-none">
              <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="text-amber-500">
                <circle cx="60" cy="45" r="3" fill="#D62828" />
                <path d="M60 20 L60 38" stroke="#D62828" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M60 70 L60 52" stroke="#D62828" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M35 45 L53 45" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M85 45 L67 45" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M42 27 L55 40" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M78 63 L65 50" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M42 63 L55 50" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M78 27 L65 40" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="60" cy="16" r="2.5" fill="#D62828" />
                <circle cx="60" cy="74" r="2.5" fill="#D62828" />
                <circle cx="31" cy="45" r="2.5" fill="#F59E0B" />
                <circle cx="89" cy="45" r="2.5" fill="#F59E0B" />
                <circle cx="39" cy="24" r="2" fill="#EAB308" />
                <circle cx="81" cy="66" r="2" fill="#EAB308" />
                <circle cx="39" cy="66" r="2" fill="#16A34A" />
                <circle cx="81" cy="24" r="2" fill="#16A34A" />
              </svg>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* META CARDS: ORDER NUMBER, DATE, STATUS                          */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Order Number */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500">Order Number</p>
              <p className="font-mono font-bold text-sm sm:text-base text-[#D62828]">
                {order.orderNumber}
              </p>
            </div>
          </div>

          {/* Card 2: Order Date */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500">Order Date</p>
              <p className="font-semibold text-xs sm:text-sm text-neutral-800">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Card 3: Order Status */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-neutral-500">Order Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                {order.status || "New"}
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* MAIN TWO-COLUMN CONTENT                                          */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ORDER ITEMS + CUSTOMER DETAILS (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Order Items Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-neutral-100">
                <ShoppingBag className="w-5 h-5 text-[#D62828] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Order Items ({order.items.length})
                </h2>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-600">
                      <th className="py-2.5 px-2 text-center w-10 text-neutral-400">#</th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700">Product</th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 w-24 text-right">
                        Rate (₹)
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 w-20 text-center">
                        Qty
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-neutral-700 w-28 text-right">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-2 text-center text-neutral-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 font-semibold text-neutral-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-neutral-700">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-neutral-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#D62828]">
                          ₹{item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Customer Details Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-neutral-100">
                <User className="w-5 h-5 text-[#D62828] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Customer Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
                <div>
                  <p className="text-[11px] font-medium text-neutral-500">Name</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral-500">Phone Number</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">+91 {order.customer.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-medium text-neutral-500">Delivery Address</p>
                  <p className="text-neutral-700 mt-0.5 leading-relaxed">
                    {order.customer.address}, {order.customer.city} — {order.customer.pincode}
                  </p>
                </div>

                {order.notes && order.notes.trim() && (
                  <div className="sm:col-span-2 pt-2 border-t border-neutral-100">
                    <p className="text-[11px] font-medium text-neutral-500">Order Notes / Instructions</p>
                    <p className="text-neutral-800 italic mt-0.5 bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
                      &ldquo;{order.notes.trim()}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY + PAYMENT + TRANSPORT + IMPORTANT (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Order Summary Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-neutral-100">
                <FileText className="w-5 h-5 text-[#D62828] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Order Summary
                </h2>
              </div>

              <div className="divide-y divide-neutral-100 mt-3 text-xs sm:text-sm">
                <div className="flex justify-between py-2 text-neutral-600">
                  <span>Total Items</span>
                  <span className="font-semibold text-neutral-900">{order.items.length}</span>
                </div>
                <div className="flex justify-between py-2 text-neutral-600">
                  <span>Total Quantity</span>
                  <span className="font-semibold text-neutral-900">{order.totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center pt-3 pb-1">
                  <span className="text-sm font-bold text-neutral-900">Total Amount</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#D62828]">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Payment Method Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6 space-y-4">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-neutral-100">
                <CreditCard className="w-5 h-5 text-[#D62828] shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Payment Method
                </h2>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Please complete the payment using any of the following methods. Mention your Order Number (
                <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>) in the payment reference.
              </p>

              {/* UPI Tab */}
              <div className="border border-neutral-200 rounded-xl p-3.5 bg-neutral-50/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                    Scan &amp; Pay via UPI
                  </span>
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-neutral-600">
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">GPay</span>
                    <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">PhonePe</span>
                    <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Paytm</span>
                  </div>
                </div>

                {/* UPI ID copy box */}
                <div className="mt-3 flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-3 py-2">
                  <div className="truncate">
                    <span className="text-[10px] text-neutral-400 block font-medium">UPI ID</span>
                    <span className="text-xs font-mono font-bold text-neutral-900">{upiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi(upiId)}
                    className="flex items-center space-x-1 text-xs font-semibold text-[#D62828] hover:text-[#B71C1C] transition-colors p-1"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[11px] text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GPay/UPI Phone Numbers */}
                {business?.gpayUpiNumbers && business.gpayUpiNumbers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-200/80">
                    <span className="text-[11px] font-semibold text-neutral-700 block mb-1">
                      Direct GPay / PhonePe Mobile Numbers:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {business.gpayUpiNumbers.map((num, i) => (
                        <span
                          key={i}
                          className="bg-white border border-neutral-200 text-neutral-800 font-mono text-xs font-semibold px-2.5 py-1 rounded"
                        >
                          +91 {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Transportation Charges Card */}
            <div className="bg-[#FFFDF7] rounded-2xl border border-amber-200/80 p-4 sm:p-5 flex items-start space-x-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-amber-900 text-xs sm:text-sm">
                  Transportation Charges
                </h3>
                <p className="text-amber-800/90 mt-1 leading-relaxed">
                  Transportation charges need to be handled only by the customer. We will arrange packing
                  and handover the goods to your preferred transport / courier service.
                </p>
              </div>
            </div>

            {/* 4. Important Notes Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center space-x-2 text-neutral-900 pb-2">
                <Info className="w-4 h-4 text-[#D62828] shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm">Important Notes</h3>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-neutral-600 list-disc list-inside leading-relaxed">
                <li>Orders will be confirmed only after payment is received.</li>
                <li>
                  Please mention your Order Number (
                  <span className="font-semibold text-neutral-800">{order.orderNumber}</span>) in the
                  payment reference.
                </li>
                <li>
                  Transportation charges are to be paid by the customer directly to the transport/courier
                  service.
                </li>
                <li>Delivery time depends on the transport service and your location.</li>
                <li>
                  For any queries, contact us at{" "}
                  <span className="font-semibold text-neutral-800">
                    +91 {business?.reachUsNumber || business?.whatsappNumber || "9943745026"}
                  </span>
                  .
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* BOTTOM ACTION BAR                                                */}
        {/* ================================================================ */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-6 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </a>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {invoiceToken && (
                <Link
                  href={`/invoice/${invoiceToken}`}
                  target="_blank"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 border border-[#D62828] bg-red-50/60 hover:bg-red-50 text-[#D62828] font-semibold text-xs sm:text-sm px-5 py-3 rounded-full transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Official Invoice</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded-full transition-colors"
              >
                <Printer className="w-4 h-4 text-neutral-500" />
                <span>Print Summary</span>
              </button>

              <Link
                href="/"
                className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-[#D62828] hover:bg-[#B71C1C] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-colors shadow-xs"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
