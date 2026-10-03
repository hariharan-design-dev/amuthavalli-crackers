import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CelebrationCTA() {
  return (
    <section className="relative w-full bg-[#080C16] overflow-hidden">
      {/* Background celebration silhouette and fireworks artwork */}
      <div className="absolute inset-0">
        <Image
          src="/images/home/cta_celebration.png"
          alt="Festive Family Fireworks Celebration"
          fill
          quality={95}
          sizes="100vw"
          className="object-cover object-[65%_center] sm:object-[60%_center] md:object-center opacity-90"
          priority
        />
        {/* Dark gradient overlay on the left to ensure high text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080C16]/95 via-[#080C16]/75 to-transparent sm:via-[#080C16]/60 lg:via-[#080C16]/45" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 z-10">
        <div className="max-w-2xl text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#FBBF24] uppercase tracking-wide font-serif">
            READY TO PLAN YOUR CELEBRATION?
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed font-normal">
            Explore the complete Amuthavalli collection and make this festival truly special for you and your loved ones.
          </p>

          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-[#F59E0B] hover:bg-[#D97706] text-neutral-950 font-bold text-xs sm:text-sm px-6 py-2.5 sm:py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
