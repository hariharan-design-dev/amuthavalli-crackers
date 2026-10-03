import React from "react";
import { Phone, MessageCircle, MapPin, CreditCard } from "lucide-react";
import type { BusinessSettings } from "@/types/database";

interface ContactDetailsProps {
  businessSettings?: BusinessSettings | null;
}

function formatPhone(num?: string | null, fallback = ""): string {
  if (!num) return fallback;
  const cleaned = num.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned}`;
  }
  if (num.startsWith("+")) return num;
  return `+91 ${num}`;
}

export function ContactDetails({ businessSettings }: ContactDetailsProps) {
  // Extract values from business settings data layer with approved defaults
  const businessMobile = formatPhone(businessSettings?.business_mobile, "+91 9943745026");
  const reachUs = formatPhone(businessSettings?.reach_us_number, "+91 9994874805");
  const whatsapp = formatPhone(businessSettings?.whatsapp_number, "+91 9655965026");
  const address =
    businessSettings?.business_address ||
    "Sivakasi – Kazhumalai Road, Sathirappatti, Vembakottai.";
  
  const gpayList =
    businessSettings?.gpay_upi_numbers && businessSettings.gpay_upi_numbers.length > 0
      ? businessSettings.gpay_upi_numbers.map((n) => formatPhone(n))
      : ["+91 9943745026", "+91 8072736369"];

  const whatsappRaw = businessSettings?.whatsapp_number
    ? businessSettings.whatsapp_number.replace(/\D/g, "")
    : "919655965026";
  const whatsappLink = `https://wa.me/${whatsappRaw.startsWith("91") ? whatsappRaw : "91" + whatsappRaw}`;

  const businessMobileRaw = businessMobile.replace(/\D/g, "");
  const reachUsRaw = reachUs.replace(/\D/g, "");

  return (
    <section id="contact-details" className="w-full bg-[#FFFDF9] py-12 sm:py-16 lg:py-20 border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Centered on desktop, left-aligned on mobile/tablet */}
        <div className="text-left lg:text-center max-w-2xl lg:mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] sm:text-xs font-bold text-[#C2410C] uppercase tracking-[0.2em] block mb-2 sm:mb-3">
            GET IN TOUCH
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 leading-[1.2] font-serif mb-3">
            Contact Details
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
            Reach us anytime for product enquiries, order assistance or store visits. Our team is always happy to help you.
          </p>
        </div>

        {/* 1. Desktop 5-Column Row with Vertical Dividers (1440px) */}
        <div className="hidden lg:grid grid-cols-5 divide-x divide-neutral-200">
          
          {/* Item 1: Business Mobile */}
          <div className="flex flex-col items-center text-center px-4 first:pl-0">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mb-4">
              <Phone className="w-5 h-5 text-[#D97706]" />
            </div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">
              Business Mobile
            </span>
            <a
              href={`tel:+${businessMobileRaw}`}
              className="text-sm lg:text-base font-bold text-neutral-900 hover:text-red-600 transition-colors tracking-tight leading-snug block"
            >
              {businessMobile}
            </a>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-[190px]">
              Call us for product enquiries and general assistance.
            </p>
          </div>

          {/* Item 2: Reach Us */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mb-4">
              <Phone className="w-5 h-5 text-[#D97706]" />
            </div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">
              Reach Us
            </span>
            <a
              href={`tel:+${reachUsRaw}`}
              className="text-sm lg:text-base font-bold text-neutral-900 hover:text-red-600 transition-colors tracking-tight leading-snug block"
            >
              {reachUs}
            </a>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-[190px]">
              Get in touch for orders, availability and other information.
            </p>
          </div>

          {/* Item 3: WhatsApp */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mb-4">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">
              WhatsApp
            </span>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm lg:text-base font-bold text-neutral-900 hover:text-emerald-600 transition-colors tracking-tight leading-snug block"
            >
              {whatsapp}
            </a>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-[190px]">
              Message us on WhatsApp for quick responses and product enquiries.
            </p>
          </div>

          {/* Item 4: Address */}
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-[#D62828] flex items-center justify-center shrink-0 mb-4">
              <MapPin className="w-5 h-5 text-[#D62828]" />
            </div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">
              Address
            </span>
            <p className="text-xs lg:text-[13px] font-bold text-neutral-900 leading-snug">
              {address}
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-[190px]">
              Visit our store to explore our wide range of crackers.
            </p>
          </div>

          {/* Item 5: GPay / UPI */}
          <div className="flex flex-col items-center text-center px-4 last:pr-0">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 mb-4">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-neutral-400 font-semibold block mb-1">
              GPay / UPI
            </span>
            <div className="space-y-0.5">
              {gpayList.map((gpayNum, idx) => (
                <span
                  key={idx}
                  className="text-sm lg:text-base font-bold text-neutral-900 tracking-tight leading-snug block"
                >
                  {gpayNum}
                </span>
              ))}
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-[190px]">
              You can also use these numbers for GPay payments.
            </p>
          </div>

        </div>

        {/* 2. Tablet & Mobile Vertical Stack (768px & 375px) */}
        <div className="lg:hidden space-y-4 max-w-xl mx-auto">
          
          {/* Mobile/Tablet Item 1: Business Mobile */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                Business Mobile
              </span>
              <a
                href={`tel:+${businessMobileRaw}`}
                className="text-sm sm:text-base font-bold text-neutral-900 hover:text-red-600 transition-colors block mt-0.5"
              >
                {businessMobile}
              </a>
              <p className="text-xs text-neutral-500 leading-snug mt-1">
                Call us for product enquiries and general assistance.
              </p>
            </div>
          </div>

          {/* Mobile/Tablet Item 2: Reach Us */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                Reach Us
              </span>
              <a
                href={`tel:+${reachUsRaw}`}
                className="text-sm sm:text-base font-bold text-neutral-900 hover:text-red-600 transition-colors block mt-0.5"
              >
                {reachUs}
              </a>
              <p className="text-xs text-neutral-500 leading-snug mt-1">
                Get in touch for orders, availability and other information.
              </p>
            </div>
          </div>

          {/* Mobile/Tablet Item 3: WhatsApp */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                WhatsApp
              </span>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-bold text-neutral-900 hover:text-emerald-600 transition-colors block mt-0.5"
              >
                {whatsapp}
              </a>
              <p className="text-xs text-neutral-500 leading-snug mt-1">
                Message us on WhatsApp for quick responses and product enquiries.
              </p>
            </div>
          </div>

          {/* Mobile/Tablet Item 4: Address */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-[#D62828] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-[#D62828]" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                Address
              </span>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug mt-0.5">
                {address}
              </p>
              <p className="text-xs text-neutral-500 leading-snug mt-1">
                Visit our store to explore our wide range of crackers.
              </p>
            </div>
          </div>

          {/* Mobile/Tablet Item 5: GPay / UPI */}
          <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                GPay / UPI
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                {gpayList.map((gpayNum, idx) => (
                  <span
                    key={idx}
                    className="text-xs sm:text-sm font-bold text-neutral-900 block"
                  >
                    {gpayNum}
                    {idx < gpayList.length - 1 && <span className="text-neutral-400 ml-2">|</span>}
                  </span>
                ))}
              </div>
              <p className="text-xs text-neutral-500 leading-snug mt-1">
                You can also use these numbers for GPay payments.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
