import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

export function OurStory() {
  return (
    <section id="our-story" className="w-full bg-[#FFFDF9] py-12 sm:py-16 lg:py-20 border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Heading, Paragraphs & CTA */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <span className="text-[11px] sm:text-xs font-bold text-[#C2410C] uppercase tracking-[0.2em] block">
              OUR STORY
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 leading-[1.2] font-serif">
              A Journey of Trust <br />
              and Togetherness
            </h2>

            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
              <p>
                Amuthavalli Crackers started with a simple vision – to bring happiness and light to every celebration.
              </p>
              <p>
                Over the years, we have grown into a well-known brand in Sivakasi, known for our wide range of quality crackers, reasonable prices and customer satisfaction.
              </p>
              <p>
                From traditional favourites to new and exciting arrivals, we continue to serve families, children and communities with products that add colour to every occasion.
              </p>
            </div>

            {/* CTA Button: Links directly to root "/" (Approved Customer Product List) */}
            <div className="pt-2 sm:pt-4">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-[#0A3D33] hover:bg-[#072C24] text-white text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <span>Our Products</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: Building Visual with Overlay/Side Panels */}
          <div className="lg:col-span-6">
            <div className="relative w-full">
              {/* Facility Storefront Image */}
              <div className="relative w-full h-[240px] sm:h-[320px] md:h-[360px] rounded-2xl overflow-hidden shadow-lg border border-neutral-200/80">
                <Image
                  src="/images/about/about_storefront.jpg"
                  alt="Amuthavalli Crackers Storefront in Sivakasi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Desktop Floating Information Panel (Overlapping bottom right) */}
              <div className="hidden lg:flex absolute -bottom-5 -right-5 bg-white/95 backdrop-blur-xs rounded-xl shadow-xl border border-neutral-100 p-4 items-center space-x-5 z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-medium block">Proudly from</span>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight block">Sivakasi</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-neutral-200" />

                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-medium block">Quality Crackers</span>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight block">for Every Celebration</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile & Tablet 2-Column Information Panels (Displayed below image) */}
            <div className="grid grid-cols-2 gap-3 mt-4 lg:hidden">
              <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-3 sm:p-4 flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#D97706]" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-medium block">Proudly from</span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight block">Sivakasi</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-3 sm:p-4 flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-medium block">Quality Crackers</span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight block">for Every Celebration</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
