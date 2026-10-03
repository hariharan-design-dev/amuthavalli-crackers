import React from "react";
import { Sparkles, Phone, MapPin } from "lucide-react";

export function TopInfoBar() {
  return (
    <header className="w-full bg-[#001B30] text-white text-xs font-normal border-b border-[#0a2845] hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-9 flex items-center justify-between">
        {/* Left Features */}
        <div className="flex items-center space-x-2 text-white/90">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <span>Quality Crackers</span>
          <span className="text-white/40">|</span>
          <span>Best Prices</span>
          <span className="text-white/40">|</span>
          <span>Safe Celebrations</span>
        </div>

        {/* Center/Right Phone & Location */}
        <div className="flex items-center space-x-6 text-white/90">
          <div className="flex items-center space-x-2">
            <Phone className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <a href="tel:+919943745026" className="hover:text-white transition-colors">
              +91 99437 45026
            </a>
            <span className="text-white/40">|</span>
            <a href="tel:+919994874805" className="hover:text-white transition-colors">
              +91 99948 74805
            </a>
          </div>

          <div className="flex items-center space-x-1.5 hidden lg:flex">
            <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span>Sivakasi, Tamil Nadu</span>
          </div>
        </div>
      </div>
    </header>
  );
}
