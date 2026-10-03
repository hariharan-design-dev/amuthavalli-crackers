"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Calendar, ChevronDown } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { OrderStats } from "@/components/admin/orders/order-stats";
import { OrderStatusTabs } from "@/components/admin/orders/order-status-tabs";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { OrderTable } from "@/components/admin/orders/order-table";
import { OrderListMobile } from "@/components/admin/orders/order-list-mobile";
import { OrderDetailsPanel } from "@/components/admin/orders/order-details-panel";
import {
  getAdminOrders,
  getAdminOrderStats,
  getOrderItems,
  type AdminOrderStats,
} from "@/actions/admin-orders";
import type {
  AdminOrder,
  GetOrdersResult,
  OrdersAdminMetrics,
  OrderStatusTabConfig,
} from "@/types/admin-order";

// ---------------------------------------------------------------------------
// Empty / loading state defaults
// ---------------------------------------------------------------------------

const EMPTY_METRICS: OrdersAdminMetrics = {
  totalOrders: { value: "0", trend: "—", trendText: "vs last month" },
  newOrders: { value: "0", trend: "—", trendText: "vs last month" },
  processingOrders: { value: "0", trend: "—", trendText: "vs last month" },
  completedOrders: { value: "0", trend: "—", trendText: "vs last month" },
};

const EMPTY_TABS: OrderStatusTabConfig[] = [
  { id: "all", label: "All Orders", count: 0 },
  { id: "New", label: "New", count: 0 },
  { id: "Confirmed", label: "Confirmed", count: 0 },
  { id: "Processing", label: "Processing", count: 0 },
  { id: "Completed", label: "Completed", count: 0 },
  { id: "Cancelled", label: "Cancelled", count: 0 },
];

const EMPTY_LIST: GetOrdersResult = {
  orders: [],
  totalCount: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

export default function AdminOrdersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // ---- Filters ----
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("All Time");

  // ---- Pagination ----
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- Data state ----
  const [stats, setStats] = useState<AdminOrderStats>({
    metrics: EMPTY_METRICS,
    tabs: EMPTY_TABS,
  });
  const [listResult, setListResult] = useState<GetOrdersResult>(EMPTY_LIST);
  const [statsLoading, setStatsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);

  // ---- Selected order + lazy-loaded items ----
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  // ---- Debounce search ----
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // ---- Load stats (once on mount) ----
  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      setStatsLoading(true);
      const result = await getAdminOrderStats();
      if (ignore) return;
      setStats(result);
      setStatsLoading(false);
    }

    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  // ---- Load paginated order list + auto-select first order ----
  useEffect(() => {
    let ignore = false;

    async function run() {
      setListLoading(true);
      const result = await getAdminOrders({
        searchQuery: debouncedSearch,
        statusFilter,
        timeFilter,
        page,
        pageSize,
      });
      if (ignore) return;
      setListResult(result);
      setListLoading(false);

      // Auto-select first order after data loads (async — safe to call setState here)
      if (result.orders.length > 0) {
        const currentSelectedId = selectedOrder?.id;
        const stillInList = result.orders.some((o) => o.id === currentSelectedId);
        if (!stillInList) {
          const firstOrder = result.orders[0];
          const items = await getOrderItems(firstOrder.id);
          if (!ignore) {
            setSelectedOrder({ ...firstOrder, items });
          }
        }
      } else {
        setSelectedOrder(null);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  // selectedOrder.id is intentionally excluded — we only want to react to list data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, timeFilter, page, pageSize]);


  // ---- Lazy load order items when an order is selected ----
  async function selectOrder(order: AdminOrder) {
    // If items already loaded, just set selected
    if (order.items && order.items.length > 0) {
      setSelectedOrder(order);
      return;
    }

    // Optimistically show the panel with loading items
    setSelectedOrder({ ...order, items: [] });
    setItemsLoading(true);

    const items = await getOrderItems(order.id);
    setSelectedOrder((prev) => {
      if (!prev || prev.id !== order.id) return prev;
      return { ...prev, items };
    });
    setItemsLoading(false);
  }

  const handleOrderUpdated = async (updatedOrder: AdminOrder) => {
    setSelectedOrder(updatedOrder);

    // Refresh list and stats
    try {
      const [ordersResult, statsResult] = await Promise.all([
        getAdminOrders({
          searchQuery: debouncedSearch,
          statusFilter,
          timeFilter,
          page,
          pageSize,
        }),
        getAdminOrderStats(),
      ]);
      setListResult(ordersResult);
      setStats(statsResult);
    } catch (err) {
      console.error("[AdminOrdersPage] Error refreshing orders after edit:", err);
    }
  };

  const handleSelectOrder = (order: AdminOrder) => {
    selectOrder(order);
  };

  const handleMobileSelectOrder = (order: AdminOrder) => {
    selectOrder(order);
    setMobileDetailsOpen(true);
  };

  const handleTabChange = (tabId: string) => {
    setStatusFilter(tabId);
    setPage(1);
  };

  const handleTimeFilterChange = (val: string) => {
    setTimeFilter(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTimeFilter("All Time");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Admin Top Header */}
      <AdminHeader
        searchPlaceholder="Search orders by order number, customer name or mobile number..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setMobileSidebarOpen(true)}
      />

      {/* 2. Admin Workspace (Sidebar + Main Content) */}
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Left Sidebar */}
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0 space-y-4 sm:space-y-5">

          {/* Header Row: Title, Subtitle, Date filter & Export button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Orders
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                View and manage all customer orders. Click on an order to see details.
              </p>
            </div>

            {/* Top Controls: Date Filter + Export Button */}
            <div className="flex items-center space-x-2.5">
              {/* Desktop/Tablet Date Dropdown */}
              <div className="relative hidden sm:flex items-center">
                <Calendar className="w-3.5 h-3.5 text-neutral-500 absolute left-3 pointer-events-none" />
                <select
                  value={timeFilter}
                  onChange={(e) => handleTimeFilterChange(e.target.value)}
                  className="appearance-none bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-lg pl-8 pr-7 py-2 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Month">This Month</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Export Button (UI presentation only) */}
              <button
                type="button"
                className="inline-flex items-center justify-center space-x-1.5 bg-[#0B3B32] hover:bg-[#072C24] text-white font-semibold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                aria-label="Export orders"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* 4 Summary / Metric Cards */}
          <OrderStats metrics={stats.metrics} loading={statsLoading} />

          {/* Status Filter Tabs */}
          <OrderStatusTabs
            tabs={stats.tabs}
            activeTab={statusFilter}
            onTabChange={handleTabChange}
          />

          {/* Search & Filter Bar */}
          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            timeFilter={timeFilter}
            onTimeFilterChange={handleTimeFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Desktop Layout: Table + Inline Details Panel (1440px) */}
          <div className="hidden lg:flex items-start space-x-4">
            <OrderTable
              orders={listResult.orders}
              selectedOrderId={selectedOrder?.id}
              onSelectOrder={handleSelectOrder}
              totalCount={listResult.totalCount}
              page={listResult.page}
              pageSize={listResult.pageSize}
              totalPages={listResult.totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={listLoading}
            />

            {selectedOrder && (
              <OrderDetailsPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                loadingItems={itemsLoading}
                onOrderUpdated={handleOrderUpdated}
              />
            )}
          </div>

          {/* Mobile & Tablet Layout: Orders Card List (375px & 768px) */}
          <div className="lg:hidden">
            <OrderListMobile
              orders={listResult.orders}
              onSelectOrder={handleMobileSelectOrder}
              totalCount={listResult.totalCount}
              page={listResult.page}
              pageSize={listResult.pageSize}
              totalPages={listResult.totalPages}
              onPageChange={handlePageChange}
              loading={listLoading}
            />
          </div>

        </main>
      </div>

      {/* Mobile Order Details Drawer / Overlay (375px) */}
      {mobileDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDetailsOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <div className="relative z-10 w-full animate-in slide-in-from-bottom duration-200">
            <OrderDetailsPanel
              order={selectedOrder}
              isMobileModal
              onClose={() => setMobileDetailsOpen(false)}
              loadingItems={itemsLoading}
              onOrderUpdated={handleOrderUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
