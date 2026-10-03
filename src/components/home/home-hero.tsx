import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrustPoints } from "./trust-points";

export function HomeHero() {
  return (
    <section className="relative w-full bg-[#080C16] overflow-hidden">
      {/* 1. Full-bleed Hero Background Visual Asset */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home/hero_festive_celebration.png"
          alt="Amuthavalli Crackers Festive Celebration with Sparkler"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_48%] md:object-[58%_50%] lg:object-[58%_50%]"
        />

        {/* 2. Cinematic Gradient Overlays:
            - Left-side deep gradient ensuring pure white text readability
            - Vignette top & bottom transitions for header and trust bar */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080C16]/95 via-[#080C16]/75 to-transparent sm:via-[#080C16]/60 lg:via-[#080C16]/45 lg:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C16]/70 via-transparent to-[#080C16]/90" />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      </div>

      {/* 3. Main Content Container (Positioned on the Left) */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-18 lg:pt-24 pb-14 sm:pb-18 md:pb-22 lg:pb-32 flex flex-col justify-center min-h-[480px] sm:min-h-[540px] lg:min-h-[580px]">
        <div className="max-w-xl lg:max-w-2xl text-left">
          
          {/* Hero Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-white leading-[1.12] tracking-tight font-serif">
            Celebrate Every <br className="hidden sm:inline" />
            Moment With <br />
            <span className="text-[#FBBF24]">Amuthavalli</span>
          </h1>

          {/* Hero Description */}
          <p className="mt-3.5 sm:mt-5 text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed font-normal">
            A wide collection of quality crackers for every celebration, from everyday favourites to colourful new arrivals.
          </p>

          {/* CTAs */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-start gap-3.5 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-[#F59E0B] hover:bg-[#D97706] text-neutral-950 font-bold text-xs sm:text-sm px-6 sm:px-7 py-3 sm:py-3.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center text-white hover:text-amber-300 font-semibold text-xs sm:text-sm px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/40 hover:border-amber-400/60 bg-white/5 backdrop-blur-xs transition-all duration-200 active:scale-95"
            >
              About Amuthavalli
            </Link>
          </div>

          {/* Mobile & Tablet 2x2 Trust Points */}
          <div className="lg:hidden mt-8 max-w-sm">
            <TrustPoints variant="mobile-grid" />
          </div>

        </div>
      </div>

      {/* 4. Desktop Horizontal Trust Points Strip (Embedded at bottom of hero) */}
      <div className="relative z-10 hidden lg:block w-full">
        <TrustPoints variant="desktop-bar" />
      </div>
    </section>
  );
}
