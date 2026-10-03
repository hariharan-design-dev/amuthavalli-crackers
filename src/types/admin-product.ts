/**
 * Authoritative Admin Product Types
 * Amuthavalli Crackers — Admin Products Real Data Integration
 *
 * Source of Truth: Supabase products, categories tables, and products storage bucket.
 * Strictly adheres to authoritative schema:
 * - products: id, category_id, name, tamil_name, market_rate, selling_rate,
 *   stock, low_stock_threshold, description, image_url, is_available, created_at, updated_at
 * - categories: id, name, created_at, updated_at
 * - Zero unsupported fields (no SKU, barcode, variants, pack_unit).
 */

export interface AdminProduct {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  tamil_name: string | null;
  market_rate: number | null;
  selling_rate: number;
  stock: number | null;
  low_stock_threshold: number | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductDisplayStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export function getProductDisplayStatus(product: {
  is_available: boolean;
  stock: number | null;
  low_stock_threshold: number | null;
}): ProductDisplayStatus {
  if (!product.is_available || (product.stock !== null && product.stock === 0)) {
    return 'Out of Stock';
  }
  if (
    product.stock !== null &&
    product.low_stock_threshold !== null &&
    product.stock <= product.low_stock_threshold
  ) {
    return 'Low Stock';
  }
  return 'In Stock';
}

export interface AdminProductCategoryTab {
  id: string; // 'all' or Category UUID
  name: string;
  count: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GetAdminProductsParams {
  searchQuery?: string;
  categoryId?: string; // 'all' or Category UUID
  statusFilter?: string; // 'all' | 'In Stock' | 'Low Stock' | 'Out of Stock'
  sortBy?: string; // 'latest' | 'price-asc' | 'price-desc' | 'name-asc'
  page?: number;
  pageSize?: number;
}

export interface GetAdminProductsResult {
  products: AdminProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  tamil_name?: string | null;
  category_id: string;
  market_rate?: number | null;
  selling_rate: number;
  stock?: number | null;
  low_stock_threshold?: number | null;
  description?: string | null;
  image_url?: string | null;
  is_available: boolean;
}

export interface UpdateProductInput {
  name?: string;
  tamil_name?: string | null;
  category_id?: string;
  market_rate?: number | null;
  selling_rate?: number;
  stock?: number | null;
  low_stock_threshold?: number | null;
  description?: string | null;
  image_url?: string | null;
  is_available?: boolean;
}

export interface ProductActionResult<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  details?: Record<string, string[]>;
}

export interface ExcelValidationRow {
  rowNumber: number;
  productName: string;
  tamilName: string | null;
  category: string;
  matchedCategoryId: string | null;
  matchedCategoryName: string | null;
  marketRate: number | null;
  sellingRate: number | null;
  stock: number | null;
  lowStockThreshold: number | null;
  description: string | null;
  isAvailable: boolean;
  status: 'valid' | 'warning' | 'error';
  errorMessages: string[];
  isExisting: boolean;
  existingProductId?: string;
}

export interface ExcelValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  newProductsCount: number;
  existingProductsCount: number;
  rows: ExcelValidationRow[];
}

export interface ExcelImportResult {
  success: boolean;
  message: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors?: string[];
}
