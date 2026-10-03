import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function InvoiceNotFound() {
  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 text-[#D62828] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Invoice Not Found</h1>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          The invoice link you followed is invalid, expired, or does not exist. Please check your link or contact support.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#B71C1C] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
