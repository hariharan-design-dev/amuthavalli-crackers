import React from "react";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";

export function VisitOurStore() {
  return (
    <section
      id="visit-our-store"
      className="relative w-full bg-[#002623] overflow-hidden min-h-[320px] sm:min-h-[380px] lg:min-h-[440px]"
    >
      {/* Layer 1: Full-width store photograph background */}
      <div className="absolute inset-0">
        <Image
          src="/images/contact/contact_store.png"
          alt="Amuthavalli Crackers Store in Sivakasi"
          fill
          quality={95}
          sizes="100vw"
          className="object-cover object-[50%_40%] sm:object-center"
          priority
        />
      </div>

      {/* Layer 2: Dark deep-green overlay — preserves store visibility, ensures text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#002623]/90 via-[#002623]/70 to-[#002623]/40 sm:from-[#002623]/85 sm:via-[#002623]/60 sm:to-[#002623]/30 lg:from-[#002623]/88 lg:via-[#002623]/55 lg:to-[#002623]/20" />
      {/* Bottom fade to ground the section visually */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#002623]/60 to-transparent" />

      {/* Layer 3: Content — text and CTA above the image */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
        <div className="max-w-xl lg:max-w-2xl space-y-4 sm:space-y-5 text-left">

          {/* Eyebrow */}
          <span className="text-amber-400 font-bold uppercase tracking-[0.2em] text-[11px] sm:text-xs block">
            VISIT OUR STORE
          </span>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-[1.2] font-serif">
            Find Us in Sivakasi
          </h2>

          {/* Supporting paragraph */}
          <p className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed max-w-lg font-normal">
            Come and experience our wide range of quality crackers at our store. We are located in the heart of Sivakasi&apos;s cracker hub and are always happy to welcome you.
          </p>

          {/* Get Directions CTA */}
          <div className="pt-2 sm:pt-4">
            <button
              type="button"
              className="inline-flex items-center space-x-2 bg-[#FED45E] hover:bg-[#F59E0B] text-neutral-950 font-bold text-xs sm:text-sm px-6 sm:px-7 py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              aria-label="Get Directions to Amuthavalli Crackers Store in Sivakasi"
            >
              <MapPin className="w-4 h-4 text-neutral-950 shrink-0" />
              <span>Get Directions</span>
              <ArrowRight className="w-4 h-4 ml-1 text-neutral-950 shrink-0" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
