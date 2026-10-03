import React from "react";
import { ShoppingCart, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import type { OrdersAdminMetrics } from "@/types/admin-order";

interface OrderStatsProps {
  metrics: OrdersAdminMetrics;
  loading?: boolean;
}

export function OrderStats({ metrics, loading = false }: OrderStatsProps) {
  const statItems = [
    {
      id: "totalOrders",
      title: "Total Orders",
      value: metrics.totalOrders.value,
      trend: metrics.totalOrders.trend,
      trendText: metrics.totalOrders.trendText,
      icon: ShoppingCart,
      iconWrapper: "bg-emerald-50 text-emerald-600",
      trendColor: "text-emerald-600",
    },
    {
      id: "newOrders",
      title: "New",
      value: metrics.newOrders.value,
      trend: metrics.newOrders.trend,
      trendText: metrics.newOrders.trendText,
      icon: Clock,
      iconWrapper: "bg-amber-50 text-amber-600",
      trendColor: "text-amber-600",
    },
    {
      id: "processingOrders",
      title: "Processing",
      value: metrics.processingOrders.value,
      trend: metrics.processingOrders.trend,
      trendText: metrics.processingOrders.trendText,
      icon: RefreshCw,
      iconWrapper: "bg-blue-50 text-blue-600",
      trendColor: "text-emerald-600",
    },
    {
      id: "completedOrders",
      title: "Completed",
      value: metrics.completedOrders.value,
      trend: metrics.completedOrders.trend,
      trendText: metrics.completedOrders.trendText,
      icon: CheckCircle2,
      iconWrapper: "bg-indigo-50 text-indigo-600",
      trendColor: "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center space-x-3 sm:space-x-3.5 animate-pulse"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neutral-200 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 bg-neutral-200 rounded w-16" />
              <div className="h-5 bg-neutral-200 rounded w-10" />
              <div className="h-3 bg-neutral-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
              <p className="text-base sm:text-xl font-black text-neutral-900 leading-tight mt-0.5 tracking-tight truncate">
                {item.value}
              </p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span
                  className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${item.trendColor}`}
                >
                  {item.trend}
                </span>
                <span className="text-[9px] sm:text-[11px] text-neutral-400 truncate">
                  {item.trendText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
