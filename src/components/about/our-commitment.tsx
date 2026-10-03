import React from "react";
import Image from "next/image";

export function OurCommitment() {
  return (
    <section id="our-commitment" className="relative w-full bg-[#002C29] overflow-hidden">
      {/* Background full-width integrated visual artwork */}
      <div className="absolute inset-0">
        <Image
          src="/images/about/about_commitment_crackers.png"
          alt="Amuthavalli Crackers Festive Product Display and Celebration"
          fill
          sizes="100vw"
          className="object-cover object-[75%_center] sm:object-right opacity-90"
          priority
        />
        {/* Dark green gradient overlay on the left to guarantee high text contrast and seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#002C29]/95 via-[#002C29]/80 to-transparent sm:via-[#002C29]/65 lg:via-[#002C29]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002C29]/80 via-transparent to-transparent sm:hidden" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 z-10">
        <div className="max-w-xl lg:max-w-2xl space-y-4 sm:space-y-5 text-left">
          <span className="text-amber-400 font-bold uppercase tracking-[0.2em] text-[11px] sm:text-xs block">
            OUR COMMITMENT
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-[1.2] font-serif">
            Safe. Bright. Memorable.
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed max-w-lg font-normal">
            We are dedicated to providing safe, high-quality crackers that add joy to your celebrations. Because your happiness is our biggest reward.
          </p>

          {/* Signature line */}
          <div className="pt-2 sm:pt-4">
            <p className="text-amber-300 font-serif italic text-base sm:text-lg tracking-wide">
              Thank you for being a part of our journey!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
