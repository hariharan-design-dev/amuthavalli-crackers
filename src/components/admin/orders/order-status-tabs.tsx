import React from "react";
import type { OrderStatusTabConfig } from "@/types/admin-order";

interface OrderStatusTabsProps {
  tabs: OrderStatusTabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function OrderStatusTabs({ tabs, activeTab, onTabChange }: OrderStatusTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mb-1 scrollbar-none">
      <div className="flex items-center space-x-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#0D7A4D] hover:bg-[#0B6B43] text-white shadow-xs"
                  : "bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/90"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 text-[11px] font-normal ${
                  isActive ? "text-emerald-100" : "text-neutral-400"
                }`}
              >
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
