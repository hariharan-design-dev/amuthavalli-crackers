import React from "react";
import { ShieldCheck, Sparkles, Tag, Shield } from "lucide-react";

interface TrustPointsProps {
  className?: string;
  variant?: "desktop-bar" | "mobile-grid";
}

export function TrustPoints({ className = "", variant = "desktop-bar" }: TrustPointsProps) {
  const points = [
    {
      title: "Premium Quality",
      icon: ShieldCheck,
    },
    {
      title: "Wide Variety",
      icon: Sparkles,
    },
    {
      title: "Best Prices",
      icon: Tag,
    },
    {
      title: "Safe Celebrations",
      icon: Shield,
    },
  ];

  if (variant === "mobile-grid") {
    return (
      <div className={`grid grid-cols-2 gap-3.5 pt-4 ${className}`}>
        {points.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="flex items-center space-x-2.5 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide">
                {point.title}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-black/40 backdrop-blur-xs border-t border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between ${className}`}
    >
      <div className="max-w-[1440px] mx-auto w-full flex flex-wrap items-center justify-around gap-4 text-white/90">
        {points.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="flex items-center space-x-2.5">
              <Icon className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
                {point.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
