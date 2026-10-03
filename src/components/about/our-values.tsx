import React from "react";
import { ShieldCheck, Sparkles, IndianRupee, PartyPopper } from "lucide-react";

interface ValueItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const VALUES_DATA: ValueItem[] = [
  {
    id: "quality",
    title: "Quality",
    description: "Carefully selected crackers for your celebrations. Safety and quality are always our priority.",
    icon: ShieldCheck,
  },
  {
    id: "variety",
    title: "Variety",
    description: "A wide range of products from sparklers, flower pots, rockets, ground chakkars and much more.",
    icon: Sparkles,
  },
  {
    id: "value",
    title: "Value",
    description: "Competitive pricing to bring you the best products at the best rates.",
    icon: IndianRupee,
  },
  {
    id: "celebration",
    title: "Celebration",
    description: "Crackers for every occasion – from small family moments to grand festivals.",
    icon: PartyPopper,
  },
];

export function OurValues() {
  return (
    <section id="our-values" className="w-full bg-[#FAF7EE] py-12 sm:py-16 lg:py-20 border-b border-neutral-200/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Left-aligned matching approved reference */}
        <div className="mb-8 sm:mb-12">
          <span className="text-[11px] sm:text-xs font-bold text-[#C2410C] uppercase tracking-[0.2em] block mb-2 sm:mb-3">
            OUR VALUES
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 leading-[1.2] font-serif">
            Why Choose Amuthavalli
          </h2>
        </div>

        {/* 4 Values Grid: 4 columns with dividers on desktop, 2x2 on mobile & tablet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-0 lg:divide-x lg:divide-neutral-200">
          {VALUES_DATA.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex flex-col items-start ${
                  index === 0
                    ? "lg:pr-8"
                    : index === VALUES_DATA.length - 1
                    ? "lg:pl-8"
                    : "lg:px-8"
                }`}
              >
                {/* Icon Circle */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D97706] flex items-center justify-center shrink-0 mb-3 sm:mb-4">
                  <Icon className="w-5 h-5 text-[#D97706]" />
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-1.5 sm:mb-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
