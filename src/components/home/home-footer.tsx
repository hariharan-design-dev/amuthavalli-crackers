import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, MessageCircle } from "lucide-react";

export function HomeFooter() {
  return (
    <footer id="contact-info" className="w-full bg-white border-t border-neutral-200 py-10 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* 1. Branding & Logo */}
          <div className="lg:col-span-4 space-y-3">
            <Link href="/" className="inline-block">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <Image
                  src="/images/logo.jpg"
                  alt="Amuthavalli Crackers"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium">
              Brightening Your Celebrations with safe, authentic, and premium Sivakasi crackers.
            </p>
          </div>

          {/* 2. Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-medium text-neutral-600">
              <li>
                <Link href="/home" className="hover:text-red-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-red-600 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-red-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-red-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Contact & Store Address */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Reach Us
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-600 font-medium">
              <div className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <a href="tel:+919943745026" className="block hover:text-red-600 transition-colors">
                    +91 99437 45026
                  </a>
                  <a href="tel:+919994874805" className="block hover:text-red-600 transition-colors">
                    +91 99948 74805
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Sivakasi – Kazhumalai Road, Sathirappatti, Vembakottai – 626 131, Tamil Nadu
                </span>
              </div>
            </div>
          </div>

          {/* 4. Connect & Social Area */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Follow Us
            </h3>
            <div className="flex items-center space-x-3 pt-1">
              {/* WhatsApp direct chat */}
              <a
                href="https://wa.me/919655965026"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
              </a>
            </div>
            <p className="text-xs text-neutral-500 pt-2 font-medium">
              Quality Crackers for a Brighter Tomorrow.
            </p>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>&copy; {new Date().getFullYear()} Amuthavalli Crackers. All rights reserved.</span>
          <span>Approved Festive Partner &bull; Sivakasi</span>
        </div>
      </div>
    </footer>
  );
}
