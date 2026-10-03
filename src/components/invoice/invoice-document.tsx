'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Printer, Copy, Check, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { InvoiceData } from '@/lib/data/invoice';
import { numberToIndianRupeesWords } from '@/lib/utils/number-to-words';

interface InvoiceDocumentProps {
  invoice: InvoiceData;
  isAdmin?: boolean;
}

export function InvoiceDocument({ invoice, isAdmin = false }: InvoiceDocumentProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(invoice.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const amountInWords = numberToIndianRupeesWords(invoice.totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shopMobileNumbers: string[] = [];
  if (invoice.business.business_mobile) shopMobileNumbers.push(invoice.business.business_mobile);
  if (invoice.business.reach_us_number) shopMobileNumbers.push(invoice.business.reach_us_number);

  return (
    <div className="min-h-screen bg-neutral-100/70 py-6 sm:py-10 print:py-0 print:bg-white text-neutral-900 font-sans">
      {/* 1. TOP ACTION TOOLBAR (Hidden when printing) */}
      <div className="max-w-[210mm] mx-auto mb-5 px-4 sm:px-0 print:hidden">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Link
              href={isAdmin ? "/admin/orders" : "/"}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAdmin ? "Back to Admin Orders" : "Back to Store"}</span>
            </Link>
            <span className="text-neutral-300">|</span>
            <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Invoice ({invoice.orderNumber})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-2 rounded-lg transition-colors focus:outline-none"
              title="Copy public invoice URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-[#D62828] hover:bg-[#B71C1C] px-4 py-2 rounded-lg transition-colors shadow-xs focus:outline-none"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INVOICE DOCUMENT CONTAINER (Standard A4 Dimensions on Print) */}
      <main className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-6 sm:p-8 border border-neutral-300 shadow-md print:shadow-none print:border-0 print:p-0 print:m-0 print:max-w-none print:w-full print:min-h-0">
        <div className="border border-neutral-800 p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
          
          {/* HEADER ROW 1: BILL OF SUPPLY */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[11px] font-bold text-neutral-700 tracking-wider">
            <span>BILL OF SUPPLY</span>
            <span>ORIGINAL FOR RECIPIENT</span>
          </div>

          {/* HEADER ROW 2: BUSINESS IDENTITY & CONTACT */}
          <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="relative w-16 h-16 shrink-0 border border-neutral-200 rounded p-1 bg-white">
                <Image
                  src={invoice.business.business_logo_url || "/images/logo.jpg"}
                  alt={invoice.business.business_name || "Amuthavalli Crackers"}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#D62828] tracking-tight uppercase">
                  {invoice.business.business_name || "AMUTHAVALLI CRACKERS"}
                </h1>
                <p className="text-xs text-neutral-700 max-w-sm mt-0.5 leading-snug">
                  {invoice.business.business_address || "Sivakasi - Kazhumalai Road, Sathirappatti, Vembakottai"}
                </p>
                {shopMobileNumbers.length > 0 && (
                  <p className="text-xs font-semibold text-neutral-800 mt-1">
                    Mobile: +91 {shopMobileNumbers.join(" | +91 ")}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right text-xs space-y-1 shrink-0">
              {invoice.business.gpay_upi_numbers && invoice.business.gpay_upi_numbers.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 p-2 rounded text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">GPay / UPI Payment</span>
                  <span className="font-bold text-neutral-900 block mt-0.5">
                    +91 {invoice.business.gpay_upi_numbers.join(" | +91 ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: TWO-COLUMN BILL TO & INVOICE DETAILS */}
          <div className="grid grid-cols-2 gap-4 border border-neutral-800 divide-x divide-neutral-800 text-xs">
            {/* Left: BILL TO (Customer Details) */}
            <div className="p-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">BILL TO</span>
              <p className="font-extrabold text-sm text-neutral-900 uppercase">{invoice.customer.name}</p>
              <p className="font-semibold text-neutral-800">Phone: +91 {invoice.customer.phone}</p>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{invoice.customer.address}</p>
              {(invoice.customer.city || invoice.customer.pincode) && (
                <p className="text-neutral-700 font-medium">
                  {[invoice.customer.city, invoice.customer.pincode].filter(Boolean).join(" - ")}
                </p>
              )}
            </div>

            {/* Right: INVOICE DETAILS */}
            <div className="p-3 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">INVOICE DETAILS</span>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">Invoice No. :</span>
                <span className="font-bold text-red-700 text-xs">{invoice.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">Invoice Date :</span>
                <span className="font-semibold text-neutral-900">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">Order Status :</span>
                <span className="font-semibold text-neutral-800 uppercase text-[11px]">{invoice.status}</span>
              </div>
              {invoice.notes && (
                <div className="pt-1 border-t border-neutral-200 mt-1">
                  <span className="text-[10px] text-neutral-500 block">Notes:</span>
                  <span className="text-[11px] italic text-neutral-700">{invoice.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: PRODUCT ITEMS TABLE */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse border border-neutral-800 text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-800 font-bold text-neutral-900 text-[11px]">
                  <th className="py-2 px-2 text-center w-10 border-r border-neutral-800">S.NO.</th>
                  <th className="py-2 px-3 border-r border-neutral-800">ITEMS</th>
                  <th className="py-2 px-3 text-center w-16 border-r border-neutral-800">QTY.</th>
                  <th className="py-2 px-3 text-right w-24 border-r border-neutral-800">RATE</th>
                  <th className="py-2 px-3 text-right w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-neutral-300">
                    <td className="py-2 px-2 text-center text-neutral-700 border-r border-neutral-800 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 text-neutral-900 font-semibold border-r border-neutral-800">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-center text-neutral-800 border-r border-neutral-800 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-800 border-r border-neutral-800 whitespace-nowrap">
                      ₹ {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-900 font-bold whitespace-nowrap">
                      ₹ {item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-800 bg-neutral-50 font-bold text-xs">
                  <td colSpan={2} className="py-2 px-3 text-neutral-900 border-r border-neutral-800 uppercase">
                    Total
                  </td>
                  <td className="py-2 px-3 text-center text-neutral-900 border-r border-neutral-800">
                    {invoice.totalQuantity}
                  </td>
                  <td className="py-2 px-3 border-r border-neutral-800" />
                  <td className="py-2 px-3 text-right text-[#D62828] font-black whitespace-nowrap text-sm">
                    ₹ {invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SECTION: SUMMARY, WORDS, TERMS & SIGNATORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-neutral-800 divide-y md:divide-y-0 md:divide-x divide-neutral-800 text-xs">
            {/* Left Box: Amount in Words & Terms */}
            <div className="p-3.5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Total Amount in Words
                </span>
                <p className="font-extrabold text-xs text-neutral-900 mt-0.5 capitalize leading-snug">
                  *** {amountInWords} ***
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Terms and Conditions
                </span>
                <ol className="list-decimal list-inside text-[10px] text-neutral-600 space-y-0.5 leading-relaxed">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Transportation charges are at buyer&apos;s risk and cost.</li>
                  <li>Subject to Sivakasi jurisdiction only.</li>
                </ol>
              </div>
            </div>

            {/* Right Box: Subtotal, Total & Authorised Signatory */}
            <div className="p-3.5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600">Sub Total</span>
                  <span className="font-semibold text-neutral-900">
                    ₹ {invoice.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-black border-t border-neutral-800 pt-1.5">
                  <span className="text-neutral-900 uppercase">Total Amount</span>
                  <span className="text-[#D62828] text-base">
                    ₹ {invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Authorised Signatory Box */}
              <div className="pt-8 border-t border-neutral-200 text-right space-y-1">
                <p className="text-[11px] font-bold text-neutral-900 uppercase">
                  For {invoice.business.business_name || "AMUTHAVALLI CRACKERS"}
                </p>
                <div className="h-8" />
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                  Authorised Signatory
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER NOTE */}
          <div className="text-center text-[10px] text-neutral-500 pt-1 border-t border-neutral-200">
            Thank you for celebrating with {invoice.business.business_name || "Amuthavalli Crackers"}!
          </div>
        </div>
      </main>
    </div>
  );
}
