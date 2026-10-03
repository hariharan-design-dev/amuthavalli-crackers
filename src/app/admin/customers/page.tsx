"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CustomerStats } from "@/components/admin/customers/customer-stats";
import { CustomerFilters } from "@/components/admin/customers/customer-filters";
import { CustomerTable } from "@/components/admin/customers/customer-table";
import { CustomerListMobile } from "@/components/admin/customers/customer-list-mobile";
import { CustomerDetailsPanel } from "@/components/admin/customers/customer-details-panel";
import { CustomerAddModal } from "@/components/admin/customers/customer-add-modal";
import { CustomerEditModal } from "@/components/admin/customers/customer-edit-modal";
import {
  getAdminCustomers,
  getAdminCustomerMetrics,
  getCustomerOrderHistory,
} from "@/actions/admin-customers";
import type {
  AdminCustomerRow,
  CustomerAdminMetrics,
  CustomerOrderHistoryItem,
} from "@/types/customer";

export default function AdminCustomersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data State
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerRow | null>(null);
  const [orderHistory, setOrderHistory] = useState<CustomerOrderHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<CustomerAdminMetrics | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("All Time");

  // Mobile Details Overlay
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<AdminCustomerRow | null>(null);

  // Search Debounce (300ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setIsLoading(true);
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  const handleTimeFilterChange = (val: string) => {
    setIsLoading(true);
    setTimeFilter(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setIsLoading(true);
    setSearchQuery("");
    setDebouncedSearch("");
    setTimeFilter("All Time");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setIsLoading(true);
    setPageSize(newSize);
    setPage(1);
  };

  // 1. Fetch Customers
  useEffect(() => {
    let ignore = false;
    async function loadCustomers() {
      try {
        const res = await getAdminCustomers({
          searchQuery: debouncedSearch,
          timeFilter,
          page,
          pageSize,
        });

        if (!ignore) {
          setCustomers(res.customers);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setSelectedCustomer((prev) => {
            if (!prev) return res.customers[0] || null;
            const matched = res.customers.find((c) => c.id === prev.id);
            return matched || res.customers[0] || null;
          });
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("[AdminCustomersPage] Fetch error:", err);
          setError("Failed to load customer records from database. Please retry.");
          setIsLoading(false);
        }
      }
    }

    loadCustomers();
    return () => {
      ignore = true;
    };
  }, [debouncedSearch, timeFilter, page, pageSize]);

  // 2. Fetch Metrics
  const refreshMetrics = async () => {
    try {
      const res = await getAdminCustomerMetrics();
      setMetrics(res);
      setIsMetricsLoading(false);
    } catch (err) {
      console.error("[AdminCustomersPage] Metrics fetch error:", err);
      setIsMetricsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadMetrics() {
      try {
        const res = await getAdminCustomerMetrics();
        if (!ignore) {
          setMetrics(res);
          setIsMetricsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[AdminCustomersPage] Metrics fetch error:", err);
          setIsMetricsLoading(false);
        }
      }
    }
    loadMetrics();
    return () => {
      ignore = true;
    };
  }, []);

  // 3. Fetch Order History for Selected Customer
  const selectedCustomerId = selectedCustomer?.id;
  useEffect(() => {
    if (!selectedCustomerId) return;
    const custId = selectedCustomerId;
    let ignore = false;

    async function loadHistory() {
      try {
        const history = await getCustomerOrderHistory(custId);
        if (!ignore) {
          setOrderHistory(history);
          setIsHistoryLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error("[AdminCustomersPage] History fetch error:", err);
          setOrderHistory([]);
          setIsHistoryLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      ignore = true;
    };
  }, [selectedCustomerId]);

  const handleSelectCustomer = (customer: AdminCustomerRow) => {
    if (selectedCustomer?.id !== customer.id) {
      setIsHistoryLoading(true);
    }
    setSelectedCustomer(customer);
  };

  const handleMobileSelectCustomer = (customer: AdminCustomerRow) => {
    if (selectedCustomer?.id !== customer.id) {
      setIsHistoryLoading(true);
    }
    setSelectedCustomer(customer);
    setMobileDetailsOpen(true);
  };

  // Add Customer Success
  const handleAddCustomerSuccess = (newCust: AdminCustomerRow) => {
    setCustomers((prev) => [newCust, ...prev]);
    setTotalCount((prev) => prev + 1);
    setSelectedCustomer(newCust);
    refreshMetrics();
  };

  // Edit Customer Success
  const handleEditCustomerSuccess = (updatedCust: AdminCustomerRow) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    if (selectedCustomer?.id === updatedCust.id) {
      setSelectedCustomer(updatedCust);
    }
  };

  const handleOpenEdit = (cust: AdminCustomerRow) => {
    setCustomerToEdit(cust);
    setIsEditModalOpen(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setDebouncedSearch((prev) => prev + "");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Admin Top Header */}
      <AdminHeader onToggleMobileMenu={() => setMobileSidebarOpen(true)} />

      {/* 2. Admin Workspace (Sidebar + Main Content) */}
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Left Sidebar (with route-aware GREEN active state for Customers) */}
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0 space-y-4 sm:space-y-5">
          {/* Header Row: Title, Subtitle & Add Customer Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Customers
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Manage your customer records and view their order history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-[#D62828] hover:bg-[#B71C1C] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center space-x-1 font-semibold underline hover:no-underline text-red-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* 4 Summary / Metric Cards */}
          <CustomerStats metrics={metrics} isLoading={isMetricsLoading} />

          {/* Search & Filter Bar */}
          <CustomerFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            timeFilter={timeFilter}
            onTimeFilterChange={handleTimeFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Desktop Layout: Table + Inline Details Panel (1440px) */}
          <div className="hidden lg:flex items-start space-x-4">
            <CustomerTable
              customers={customers}
              selectedCustomerId={selectedCustomer?.id}
              onSelectCustomer={handleSelectCustomer}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isLoading}
            />

            {selectedCustomer && (
              <CustomerDetailsPanel
                customer={selectedCustomer}
                orderHistory={orderHistory}
                isHistoryLoading={isHistoryLoading}
                onClose={() => setSelectedCustomer(null)}
                onEditCustomer={handleOpenEdit}
              />
            )}
          </div>

          {/* Mobile & Tablet Layout: Customer Card List (375px & 768px) */}
          <div className="lg:hidden">
            <CustomerListMobile
              customers={customers}
              onSelectCustomer={handleMobileSelectCustomer}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>

      {/* Mobile Customer Details Drawer / Overlay (375px) */}
      {mobileDetailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDetailsOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <div className="relative z-10 w-full animate-in slide-in-from-bottom duration-200">
            <CustomerDetailsPanel
              customer={selectedCustomer}
              orderHistory={orderHistory}
              isHistoryLoading={isHistoryLoading}
              isMobileModal
              onClose={() => setMobileDetailsOpen(false)}
              onEditCustomer={(cust) => {
                setMobileDetailsOpen(false);
                handleOpenEdit(cust);
              }}
            />
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <CustomerAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddCustomerSuccess}
      />

      {/* Edit Customer Modal */}
      <CustomerEditModal
        isOpen={isEditModalOpen}
        customer={customerToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={handleEditCustomerSuccess}
      />
    </div>
  );
}
