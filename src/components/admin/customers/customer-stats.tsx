"use client";

import React from "react";
import { User, ShoppingCart, IndianRupee, Users } from "lucide-react";
import type { CustomerAdminMetrics } from "@/types/customer";

interface CustomerStatsProps {
  metrics: CustomerAdminMetrics | null;
  isLoading?: boolean;
}

export function CustomerStats({ metrics, isLoading = false }: CustomerStatsProps) {
  const statItems = [
    {
      id: "totalCustomers",
      title: "Total Customers",
      value: metrics?.totalCustomers.value ?? "0",
      trend: metrics?.totalCustomers.trend ?? "0%",
      trendText: metrics?.totalCustomers.trendText ?? "vs last month",
      icon: User,
      iconWrapper: "bg-red-50 text-red-500",
    },
    {
      id: "totalOrders",
      title: "Total Orders",
      value: metrics?.totalOrders.value ?? "0",
      trend: metrics?.totalOrders.trend ?? "0%",
      trendText: metrics?.totalOrders.trendText ?? "vs last month",
      icon: ShoppingCart,
      iconWrapper: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "totalOrderValue",
      title: "Total Order Value",
      value: metrics?.totalOrderValue.value ?? "₹ 0",
      trend: metrics?.totalOrderValue.trend ?? "0%",
      trendText: metrics?.totalOrderValue.trendText ?? "vs last month",
      icon: IndianRupee,
      iconWrapper: "bg-amber-50 text-amber-600",
    },
    {
      id: "newCustomers",
      title: "New Customers",
      value: metrics?.newCustomers.value ?? "0",
      trend: metrics?.newCustomers.trend ?? "0%",
      trendText: metrics?.newCustomers.trendText ?? "this month",
      icon: Users,
      iconWrapper: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center space-x-3 sm:space-x-3.5"
          >
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${item.iconWrapper}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs text-neutral-500 font-medium block truncate">
                {item.title}
              </span>

              {isLoading ? (
                <div className="mt-1 space-y-1">
                  <div className="h-5 bg-neutral-200 rounded animate-pulse w-16" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-24" />
                </div>
              ) : (
                <>
                  <p className="text-base sm:text-xl font-black text-neutral-900 leading-tight mt-0.5 tracking-tight truncate">
                    {item.value}
                  </p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 whitespace-nowrap">
                      ↑ {item.trend}
                    </span>
                    <span className="text-[9px] sm:text-[11px] text-neutral-400 truncate">
                      {item.trendText}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
