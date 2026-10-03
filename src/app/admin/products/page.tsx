"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ProductHeader } from "@/components/admin/products/product-header";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductCategoryTabs } from "@/components/admin/products/product-category-tabs";
import { ProductGrid } from "@/components/admin/products/product-grid";
import { ProductEditModal } from "@/components/admin/products/product-edit-modal";
import { ProductAddModal } from "@/components/admin/products/product-add-modal";
import { ExcelImportModal } from "@/components/admin/products/excel-import-modal";
import {
  getAdminProducts,
  getAdminCategories,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleProductAvailability,
} from "@/actions/admin-products";
import type {
  AdminProduct,
  AdminCategory,
  AdminProductCategoryTab,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/admin-product";

export default function AdminProductsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Products & Categories state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryTabs, setCategoryTabs] = useState<AdminProductCategoryTab[]>([
    { id: "all", name: "All", count: 0 },
  ]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Modals State
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [importExcelOpen, setImportExcelOpen] = useState(false);

  // Search debounce ref
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Load categories and product counts
  const loadCategories = async () => {
    const res = await getAdminCategories();
    setCategoryTabs(res.tabs);
    setCategories(res.categories);
  };

  useEffect(() => {
    let ignore = false;
    async function run() {
      const res = await getAdminCategories();
      if (ignore) return;
      setCategoryTabs(res.tabs);
      setCategories(res.categories);
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  // Load products when filters or search change
  useEffect(() => {
    let ignore = false;

    async function run() {
      setProductsLoading(true);
      const res = await getAdminProducts({
        searchQuery: debouncedSearch,
        categoryId: categoryFilter,
        statusFilter,
        sortBy,
        pageSize: 100, // Fetch catalog
      });
      if (ignore) return;
      setProducts(res.products);
      setProductsLoading(false);
    }

    run();
    return () => {
      ignore = true;
    };
  }, [debouncedSearch, categoryFilter, statusFilter, sortBy]);

  // Sync category pill tab selection with categoryFilter
  const handleSelectCategoryTab = (tabId: string) => {
    setCategoryFilter(tabId);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSortBy("latest");
  };

  // Add Product handler
  const handleAddProduct = async (
    input: CreateProductInput,
    imageFile?: File
  ): Promise<boolean> => {
    let imageFormData: FormData | undefined;
    if (imageFile) {
      imageFormData = new FormData();
      imageFormData.append("file", imageFile);
    }

    const res = await createAdminProduct(input, imageFormData);
    if (res.success && res.data) {
      setProducts((prev) => [res.data!, ...prev]);
      loadCategories(); // Refresh counts
      return true;
    }
    alert(res.message || "Failed to create product.");
    return false;
  };

  // Edit Product handler
  const handleSaveProduct = async (
    id: string,
    input: UpdateProductInput,
    imageFile?: File | null
  ): Promise<boolean> => {
    let imageFormData: FormData | undefined;
    if (imageFile) {
      imageFormData = new FormData();
      imageFormData.append("file", imageFile);
    }

    const res = await updateAdminProduct(id, input, imageFormData);
    if (res.success && res.data) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data! : p))
      );
      loadCategories();
      return true;
    }
    alert(res.message || "Failed to update product.");
    return false;
  };

  // Delete Product handler
  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    const res = await deleteAdminProduct(productId);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      loadCategories();
      return true;
    }
    alert(res.message || "Failed to delete product.");
    return false;
  };

  // Availability Toggle handler
  const handleToggleAvailability = async (
    productId: string,
    currentAvailable: boolean
  ) => {
    const nextAvailable = !currentAvailable;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, is_available: nextAvailable } : p
      )
    );

    const res = await toggleProductAvailability(productId, nextAvailable);
    if (!res.success) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_available: currentAvailable } : p
        )
      );
      alert(res.message || "Failed to update availability.");
    }
  };

  // Excel import complete handler
  const handleImportComplete = () => {
    loadCategories();
    // Reload products
    getAdminProducts({
      searchQuery: debouncedSearch,
      categoryId: categoryFilter,
      statusFilter,
      sortBy,
      pageSize: 100,
    }).then((res) => setProducts(res.products));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Admin Top Header */}
      <AdminHeader
        searchPlaceholder="Search products by name, category, or keyword..."
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
          {/* Header Row: Title, Subtitle, + Add Product & Import Excel */}
          <ProductHeader
            onAddProduct={() => setAddProductOpen(true)}
            onImportExcel={() => setImportExcelOpen(true)}
          />

          {/* Search, Dropdown Filters, Sort & Clear Filters */}
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onClearFilters={handleClearFilters}
            categories={categories}
          />

          {/* Horizontally Scrollable Category Tabs */}
          <ProductCategoryTabs
            activeTab={categoryFilter}
            onSelectTab={handleSelectCategoryTab}
            categories={categoryTabs}
          />

          {/* Responsive Product Grid */}
          <ProductGrid
            products={products}
            onEdit={(product) => setEditingProduct(product)}
            onDelete={handleDeleteProduct}
            onToggleAvailability={handleToggleAvailability}
            onClearFilters={handleClearFilters}
            loading={productsLoading}
          />
        </main>
      </div>

      {/* Modals & Dialogs */}
      {/* 1. Edit Product Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        categories={categories}
      />

      {/* 2. Add Product Modal */}
      <ProductAddModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onAdd={handleAddProduct}
        categories={categories}
      />

      {/* 3. Excel Bulk Import Wizard */}
      <ExcelImportModal
        isOpen={importExcelOpen}
        onClose={() => setImportExcelOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
