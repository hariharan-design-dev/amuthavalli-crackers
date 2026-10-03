import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy, Sparkles, IndianRupee, ShieldCheck } from "lucide-react";
import { ABOUT_VALUES } from "@/lib/data/home-data";

export function AboutAmuthavalli() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "award":
        return Trophy;
      case "sparkles":
        return Sparkles;
      case "rupee":
        return IndianRupee;
      case "shield":
      default:
        return ShieldCheck;
    }
  };

  return (
    <section id="about-amuthavalli" className="w-full bg-[#FFFDF9] py-10 sm:py-14 border-b border-neutral-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Heading, Paragraph & CTA */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[11px] sm:text-xs font-bold text-[#D62828] uppercase tracking-wider block">
              ABOUT AMUTHAVALLI
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 leading-[1.2] font-serif">
              Made for Celebrations <br />
              That Bring Everyone Together
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
              Amuthavalli Crackers brings you a wide range of quality crackers directly from the heart of Sivakasi. We are committed to offering safe, affordable and vibrant products for families, friends and all your special moments.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center space-x-2 bg-[#D62828] hover:bg-[#B71C1C] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-xs hover:shadow-md active:scale-95"
              >
                <span>Know Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Center Column: Business Storefront / Factory Building Image */}
          <div className="lg:col-span-5 relative w-full h-[220px] sm:h-[280px] lg:h-[300px] rounded-2xl overflow-hidden shadow-md border border-neutral-200/80">
            <Image
              src="/images/home/about_storefront.jpg"
              alt="Amuthavalli Crackers Storefront and Premises in Sivakasi"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center hover:scale-102 transition-transform duration-300"
            />
          </div>

          {/* Right Column: 4 Core Values & Benefits */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5">
            {ABOUT_VALUES.map((val) => {
              const Icon = getIcon(val.icon);
              return (
                <div key={val.id} className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                      {val.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-500 leading-snug mt-0.5">
                      {val.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
