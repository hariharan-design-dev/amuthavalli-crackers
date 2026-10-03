import React from "react";
import Image from "next/image";

export function AboutHero() {
  return (
    <section className="relative w-full bg-[#080C16] overflow-hidden">
      {/* 1. Full-bleed Hero Background Visual Asset */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/about/about_hero_celebration.png"
          alt="Amuthavalli Crackers Legacy Celebration"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] md:object-[58%_center] lg:object-center"
        />

        {/* 2. Cinematic Gradient Overlays:
            - Left-side deep gradient ensuring high contrast for white text (0–45% width)
            - Top and bottom vignette edge transitions */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080C16]/95 via-[#080C16]/75 to-transparent sm:via-[#080C16]/60 lg:via-[#080C16]/45 lg:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C16]/70 via-transparent to-[#080C16]/85" />
      </div>

      {/* 3. Main Content Container (Positioned on the Left) */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 flex flex-col justify-center min-h-[440px] sm:min-h-[500px] lg:min-h-[540px]">
        <div className="max-w-xl lg:max-w-2xl text-left">
          
          <span className="inline-block text-amber-400 font-bold uppercase tracking-[0.2em] text-[11px] sm:text-xs mb-3">
            ABOUT AMUTHAVALLI
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-black text-white leading-[1.14] tracking-tight font-serif">
            More Than Just <br />
            Crackers – It’s Our <br />
            <span className="text-[#FBBF24]">Legacy</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed font-normal">
            Amuthavalli Crackers has been a trusted name in bringing joy and colour to celebrations for years. We are committed to offering high-quality crackers that make every moment brighter, safer and more special.
          </p>

          {/* Signature Line with golden cursive/serif flourish */}
          <div className="mt-6 sm:mt-8 inline-flex flex-col items-start">
            <span className="text-amber-300 font-serif italic text-base sm:text-lg tracking-wide">
              Tradition · Quality · Celebrations
            </span>
            <svg
              className="w-48 sm:w-56 h-2.5 mt-1 text-amber-400/70"
              viewBox="0 0 200 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6C40 2.5 80 1.5 115 4C150 6.5 180 4.5 198 2.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
