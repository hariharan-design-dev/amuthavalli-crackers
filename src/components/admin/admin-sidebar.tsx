"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  // Navigation Items
  const navItems = [
    {
      id: "customers",
      label: "Customers",
      href: "/admin/customers",
      icon: Users,
      hasSubmenu: false,
    },
    {
      id: "orders",
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      hasSubmenu: false,
    },
    {
      id: "products",
      label: "Products",
      href: "/admin/products",
      icon: Package,
      hasSubmenu: false,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      hasSubmenu: true,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-5 px-3">
      {/* Top Nav Items */}
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <div key={item.id} className="space-y-1">
              <Link
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[#0D7A4D] hover:bg-[#0B6B43] text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isActive ? "text-white" : "text-neutral-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.hasSubmenu && (
                  isActive ? (
                    <ChevronUp className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  )
                )}
              </Link>

              {item.id === "settings" && isActive && (
                <div className="pl-3 pr-1 py-1 space-y-1 animate-in fade-in-50 duration-150">
                  <a
                    href="#general-settings"
                    onClick={onCloseMobile}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#0D7A4D]" />
                    <span>General Settings</span>
                  </a>
                  <a
                    href="#admin-account"
                    onClick={onCloseMobile}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Admin Settings</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Logout Item */}
      <div className="pt-4 border-t border-neutral-200/80">
        <button
          type="button"
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (1440px) */}
      <aside className="hidden lg:block w-56 shrink-0 bg-white border-r border-neutral-200 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer (375px & 768px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Admin Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
