import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, Menu } from "lucide-react";

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export function AdminHeader({
  onToggleMobileMenu,
  searchPlaceholder = "Search customers by name or mobile number...",
  searchValue,
  onSearchChange,
}: AdminHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/admin/customers" className="flex items-center">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Image
                src="/images/logo.jpg"
                alt="Amuthavalli Crackers Admin"
                fill
                priority
                sizes="40px"
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar (Hidden on mobile, visible on desktop/tablet) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6 lg:mx-12">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200/90 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
            />
          </div>
        </div>

        {/* Right: Admin Profile */}
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none"
            aria-label="Admin Profile Menu"
          >
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-rose-200">
              A
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-neutral-800">
              Admin
            </span>
            <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

      </div>
    </header>
  );
}
