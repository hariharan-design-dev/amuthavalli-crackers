"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Menu, X, ArrowRight } from "lucide-react";

interface CustomerHeaderProps {
  totalItems?: number;
  totalAmount?: number;
  onCartClick?: () => void;
  activeNav?: "home" | "products" | "about" | "contact";
  cartVariant?: "compact" | "full";
}

export function CustomerHeader({
  totalItems = 0,
  totalAmount = 0,
  onCartClick,
  activeNav = "products",
  cartVariant = "full",
}: CustomerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Mobile / Tablet Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-neutral-800 hover:text-neutral-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Amuthavalli Crackers Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded">
            {/* Logo Image */}
            <div className="relative h-10 w-10 sm:h-12 sm:w-12">
              <Image
                src="/images/logo.jpg"
                alt="Amuthavalli Crackers"
                fill
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Center Navigation */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          {activeNav === "home" ? (
            <div className="relative py-2 text-red-600">
              <span>Home</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            </div>
          ) : (
            <Link
              href="/home"
              className="text-neutral-700 hover:text-red-600 transition-colors py-2"
            >
              Home
            </Link>
          )}

          {activeNav === "products" ? (
            <div className="relative py-2 text-red-600">
              <span>Products</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            </div>
          ) : (
            <Link
              href="/"
              className="text-neutral-700 hover:text-red-600 transition-colors py-2"
            >
              Products
            </Link>
          )}

          {activeNav === "about" ? (
            <div className="relative py-2 text-red-600">
              <span>About Us</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            </div>
          ) : (
            <Link
              href="/about"
              className="text-neutral-700 hover:text-red-600 transition-colors py-2"
            >
              About Us
            </Link>
          )}

          {activeNav === "contact" ? (
            <div className="relative py-2 text-red-600">
              <span>Contact</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            </div>
          ) : (
            <Link
              href="/contact"
              className="text-neutral-700 hover:text-red-600 transition-colors py-2"
            >
              Contact
            </Link>
          )}
        </div>

        {/* Right Cart Summary Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onCartClick}
            className="flex items-center bg-[#D62828] hover:bg-[#B71C1C] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-md text-sm sm:text-base font-bold transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
            aria-label={`Shopping cart with ${totalItems} items totaling ₹${totalAmount.toFixed(2)}`}
          >
            <ShoppingCart className="w-[18px] h-[18px] sm:w-5 sm:h-5 mr-2 shrink-0" />
            <span className="whitespace-nowrap">
              {cartVariant === "compact"
                ? `Cart (${totalItems})`
                : `${totalItems} Items \u00A0₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <ArrowRight className="w-[18px] h-[18px] sm:w-5 sm:h-5 ml-2 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <Link
            href="/home"
            onClick={() => setMobileMenuOpen(false)}
            className={
              activeNav === "home"
                ? "block px-3 py-2 text-red-600 font-semibold bg-red-50 rounded-md"
                : "block px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md font-medium"
            }
          >
            Home
          </Link>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={
              activeNav === "products"
                ? "block px-3 py-2 text-red-600 font-semibold bg-red-50 rounded-md"
                : "block px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md font-medium"
            }
          >
            Products
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={
              activeNav === "about"
                ? "block px-3 py-2 text-red-600 font-semibold bg-red-50 rounded-md"
                : "block px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md font-medium"
            }
          >
            About Us
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={
              activeNav === "contact"
                ? "block px-3 py-2 text-red-600 font-semibold bg-red-50 rounded-md"
                : "block px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-md font-medium"
            }
          >
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
}
