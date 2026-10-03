"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopInfoBar } from "@/components/customer/top-info-bar";
import { CustomerHeader } from "@/components/customer/customer-header";
import { TopBanner } from "@/components/customer/top-banner";
import { CategoryNav } from "@/components/customer/category-nav";
import { CategorySection } from "@/components/customer/category-section";
import { ProductModal } from "@/components/customer/product-modal";
import { useCart } from "@/context/cart-context";
import {
  getPublicProductCatalog,
  type CustomerCategoryGroup,
  type CustomerProductItem,
} from "@/lib/data/catalog";
import { Loader2, PackageOpen } from "lucide-react";

export default function CustomerProductListPage() {
  const router = useRouter();
  // Shared Cart State from CartProvider (persisted in localStorage)
  const { items: quantities, totalQuantity, setQuantity } = useCart();

  // Catalog data from Supabase
  const [groupedCategories, setGroupedCategories] = useState<CustomerCategoryGroup[]>([]);
  const [allProducts, setAllProducts] = useState<CustomerProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Selected row for visual highlight
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Active product for details & quantity update modal
  const [activeModalProduct, setActiveModalProduct] = useState<CustomerProductItem | null>(null);

  // Active category filter from navigation strip
  const [activeCategory, setActiveCategory] = useState<string>("All Products");

  // Load real catalog on mount
  useEffect(() => {
    let ignore = false;
    async function loadCatalog() {
      setLoading(true);
      const res = await getPublicProductCatalog();
      if (ignore) return;
      setGroupedCategories(res.groupedCategories);
      setAllProducts(res.allProducts);
      setCategoriesList(res.groupedCategories.map((c) => ({ id: c.id, name: c.name })));
      if (res.allProducts.length > 0) {
        setSelectedProductId(res.allProducts[0].id);
      }
      setLoading(false);
    }
    loadCatalog();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle quantity updates (from table inputs, mobile cards, or modal)
  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantity(productId, Math.max(0, quantity));
  };

  // Handle product click to open modal & update selection
  const handleProductClick = (product: CustomerProductItem) => {
    setSelectedProductId(product.id);
    setActiveModalProduct(product);
  };

  // Close modal
  const handleCloseModal = () => {
    setActiveModalProduct(null);
  };

  // Calculate cart summary directly from actual quantities in CartProvider & real product selling rates
  const cartTotalItems = totalQuantity;
  const cartTotalAmount = useMemo(() => {
    const productPriceMap = new Map<string, number>();
    for (const p of allProducts) {
      productPriceMap.set(p.id, p.selling_rate);
    }
    return Object.entries(quantities).reduce((sum, [pId, qty]) => {
      const price = productPriceMap.get(pId) ?? 0;
      return sum + qty * price;
    }, 0);
  }, [allProducts, quantities]);

  // Filter categories if a specific category is selected in the category nav strip
  const displayedCategories = useMemo(() => {
    return groupedCategories.filter((cat) => {
      if (activeCategory === "All Products") return true;
      return cat.name.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [groupedCategories, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* 1. Top Navy Information Bar */}
      <TopInfoBar />

      {/* 2. Main Navigation Header */}
      <CustomerHeader
        totalItems={cartTotalItems}
        totalAmount={cartTotalAmount}
        onCartClick={() => {
          router.push("/checkout");
        }}
      />

      {/* 3. Top Promotional Banner */}
      <TopBanner />

      {/* 4. Horizontal Category Navigation Strip */}
      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={(category) => setActiveCategory(category)}
        categories={categoriesList}
      />

      {/* 5. Main Product Catalog Section */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#D62828] animate-spin" />
            <p className="text-sm font-semibold text-neutral-600">
              Loading Amuthavalli Crackers Catalogue...
            </p>
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200/80 p-12 text-center space-y-3 max-w-md mx-auto my-12 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <PackageOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              No products available
            </h3>
            <p className="text-xs text-neutral-500">
              There are currently no available products in this category.
            </p>
            {activeCategory !== "All Products" && (
              <button
                type="button"
                onClick={() => setActiveCategory("All Products")}
                className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-[#D62828] text-white hover:bg-[#B51E1E] transition-colors cursor-pointer"
              >
                View All Products
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCategories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                quantities={quantities}
                onQuantityChange={handleQuantityChange}
                onProductClick={handleProductClick}
                selectedProductId={selectedProductId}
              />
            ))}
          </div>
        )}
      </main>

      {/* 6. Product Details & Quantity Update Modal */}
      <ProductModal
        product={activeModalProduct}
        isOpen={Boolean(activeModalProduct)}
        onClose={handleCloseModal}
        currentQuantity={
          activeModalProduct
            ? (quantities[activeModalProduct.id] ?? 0)
            : 0
        }
        onQuantityChange={handleQuantityChange}
      />
    </div>
  );
}
