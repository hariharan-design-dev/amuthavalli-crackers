'use server';

import { createClient } from '@/lib/supabase/server';
import type { Category, Product } from '@/types/database';

/**
 * Data Access Layer: Customer Public Catalog
 * Phase: Customer Product Catalogue — Real Data Integration
 *
 * Centralizes read-only public catalog queries for Customer Storefront.
 * Adheres strictly to RLS boundaries (only is_available = true products exposed).
 * Filters out temporary test categories and test products from public catalog.
 */

export interface CustomerProductItem {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  tamil_name: string | null;
  market_rate: number | null;
  selling_rate: number;
  stock: number | null;
  low_stock_threshold: number | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  serial_number?: number;
}

export interface CustomerCategoryGroup {
  id: string;
  name: string;
  productCount: number;
  products: CustomerProductItem[];
}

export async function getPublicCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at, updated_at')
    .not('name', 'ilike', 'TEST%')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getPublicCategories] Error fetching categories:', error.message);
    return [];
  }

  return (data as Category[]) || [];
}

export async function getPublicProducts(categoryId?: string): Promise<CustomerProductItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select(
      'id, category_id, name, tamil_name, market_rate, selling_rate, stock, low_stock_threshold, description, image_url, is_available, created_at, updated_at, category:categories(id, name)'
    )
    .eq('is_available', true)
    .not('name', 'ilike', 'TEST%')
    .order('created_at', { ascending: true });

  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getPublicProducts] Error fetching products:', error.message);
    return [];
  }

  const rawRows = (data || []) as unknown as Array<Product & { category?: { id: string; name: string } | null }>;

  return rawRows.map((p) => ({
    id: p.id,
    category_id: p.category_id,
    category_name: p.category?.name ?? undefined,
    name: p.name,
    tamil_name: p.tamil_name,
    market_rate: p.market_rate !== null ? Number(p.market_rate) : null,
    selling_rate: Number(p.selling_rate),
    stock: p.stock !== null ? Number(p.stock) : null,
    low_stock_threshold: p.low_stock_threshold !== null ? Number(p.low_stock_threshold) : null,
    description: p.description,
    image_url: p.image_url,
    is_available: p.is_available,
  }));
}

export async function getPublicProductCatalog(): Promise<{
  categories: Category[];
  groupedCategories: CustomerCategoryGroup[];
  allProducts: CustomerProductItem[];
}> {
  const [categories, products] = await Promise.all([
    getPublicCategories(),
    getPublicProducts(),
  ]);

  // Group products by category_id
  const productsByCat = new Map<string, CustomerProductItem[]>();
  for (const p of products) {
    const list = productsByCat.get(p.category_id) || [];
    list.push({
      ...p,
      serial_number: list.length + 1,
    });
    productsByCat.set(p.category_id, list);
  }

  // Only include categories that have available products
  const groupedCategories: CustomerCategoryGroup[] = [];
  for (const cat of categories) {
    const catProducts = productsByCat.get(cat.id) || [];
    if (catProducts.length > 0) {
      groupedCategories.push({
        id: cat.id,
        name: cat.name,
        productCount: catProducts.length,
        products: catProducts,
      });
    }
  }

  return {
    categories,
    groupedCategories,
    allProducts: products,
  };
}

export async function getPublicProductById(id: string): Promise<CustomerProductItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, category_id, name, tamil_name, market_rate, selling_rate, stock, low_stock_threshold, description, image_url, is_available, created_at, updated_at'
    )
    .eq('id', id)
    .eq('is_available', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    category_id: data.category_id,
    name: data.name,
    tamil_name: data.tamil_name,
    market_rate: data.market_rate !== null ? Number(data.market_rate) : null,
    selling_rate: Number(data.selling_rate),
    stock: data.stock !== null ? Number(data.stock) : null,
    low_stock_threshold: data.low_stock_threshold !== null ? Number(data.low_stock_threshold) : null,
    description: data.description,
    image_url: data.image_url,
    is_available: data.is_available,
  };
}
