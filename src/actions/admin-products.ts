'use server';

/**
 * Server Actions: Admin Products Real Data Integration
 * Phase: Stage 2C — Implementation
 * Source of Truth: Supabase products, categories tables, and products storage bucket.
 *
 * Enforces:
 * - Server-authoritative data access (zero browser service-role key exposure)
 * - Real category UUID references and live category product counts
 * - Historical order preservation (editing products never modifies past order_items)
 * - Restricted deletion when products are referenced by existing order_items
 * - Single image storage in 'products' bucket with 800 KB limit and strict MIME validation
 * - Excel bulk import validation, category normalization, and name-based existing product matching
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  AdminProduct,
  AdminProductCategoryTab,
  AdminCategory,
  GetAdminProductsParams,
  GetAdminProductsResult,
  CreateProductInput,
  UpdateProductInput,
  ProductActionResult,
  ExcelValidationSummary,
  ExcelValidationRow,
  ExcelImportResult,
} from '@/types/admin-product';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ProductJoinRow {
  id: string;
  category_id: string;
  name: string;
  tamil_name: string | null;
  market_rate: number | string | null;
  selling_rate: number | string;
  stock: number | null;
  low_stock_threshold: number | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
}

function mapProductRow(row: ProductJoinRow): AdminProduct {
  return {
    id: row.id,
    category_id: row.category_id,
    category_name: row.category?.name ?? 'Uncategorized',
    name: row.name,
    tamil_name: row.tamil_name,
    market_rate: row.market_rate !== null ? Number(row.market_rate) : null,
    selling_rate: Number(row.selling_rate),
    stock: row.stock !== null ? Number(row.stock) : null,
    low_stock_threshold:
      row.low_stock_threshold !== null ? Number(row.low_stock_threshold) : null,
    description: row.description,
    image_url: row.image_url,
    is_available: row.is_available,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Normalizes category string to alphanumeric lowercase for robust fuzzy matching */
function normalizeCategoryKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ---------------------------------------------------------------------------
// 1. getAdminProducts
// ---------------------------------------------------------------------------

export async function getAdminProducts(
  params: GetAdminProductsParams = {}
): Promise<GetAdminProductsResult> {
  const {
    searchQuery = '',
    categoryId = 'all',
    statusFilter = 'all',
    sortBy = 'latest',
    page = 1,
    pageSize = 50,
  } = params;

  const supabase = createServiceRoleClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('*, category:categories(id, name)', { count: 'exact' });

  // Category filter
  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  // Search filter
  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    const escaped = trimmedSearch.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(`name.ilike.%${escaped}%,tamil_name.ilike.%${escaped}%`);
  }

  // Stock / Availability filter
  if (statusFilter === 'Out of Stock') {
    query = query.or('is_available.eq.false,stock.eq.0');
  } else if (statusFilter === 'In Stock') {
    query = query.eq('is_available', true);
    // In stock products have positive stock or unmanaged stock (stock is null)
  }

  // Sorting
  if (sortBy === 'price-asc') {
    query = query.order('selling_rate', { ascending: true });
  } else if (sortBy === 'price-desc') {
    query = query.order('selling_rate', { ascending: false });
  } else if (sortBy === 'name-asc') {
    query = query.order('name', { ascending: true });
  } else {
    // default: latest
    query = query.order('created_at', { ascending: false });
  }

  // Range
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminProducts] Error:', error.message);
    return { products: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }

  const rawRows = (data ?? []) as unknown as ProductJoinRow[];
  let products = rawRows.map(mapProductRow);

  // If statusFilter is 'Low Stock', apply filter on derived threshold
  if (statusFilter === 'Low Stock') {
    products = products.filter(
      (p) =>
        p.is_available &&
        p.stock !== null &&
        p.low_stock_threshold !== null &&
        p.stock > 0 &&
        p.stock <= p.low_stock_threshold
    );
  } else if (statusFilter === 'In Stock') {
    products = products.filter(
      (p) =>
        p.is_available &&
        (p.stock === null ||
          p.low_stock_threshold === null ||
          p.stock > p.low_stock_threshold)
    );
  }

  const totalCount = count ?? products.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// 2. getAdminCategories
// ---------------------------------------------------------------------------

export async function getAdminCategories(): Promise<{
  tabs: AdminProductCategoryTab[];
  categories: AdminCategory[];
}> {
  const supabase = createServiceRoleClient();

  // 1. Fetch all categories
  const { data: catRows, error: catErr } = await supabase
    .from('categories')
    .select('id, name, created_at, updated_at')
    .order('name', { ascending: true });

  if (catErr || !catRows) {
    console.error('[getAdminCategories] Categories error:', catErr?.message);
    return {
      tabs: [{ id: 'all', name: 'All', count: 0 }],
      categories: [],
    };
  }

  // 2. Fetch all products (just category_id) to calculate exact counts per category
  const { data: prodRows, error: prodErr } = await supabase
    .from('products')
    .select('id, category_id');

  if (prodErr) {
    console.error('[getAdminCategories] Products error:', prodErr.message);
  }

  const products = prodRows ?? [];
  const totalProducts = products.length;

  const countByCatId = new Map<string, number>();
  for (const p of products) {
    const current = countByCatId.get(p.category_id) ?? 0;
    countByCatId.set(p.category_id, current + 1);
  }

  const tabs: AdminProductCategoryTab[] = [
    { id: 'all', name: 'All', count: totalProducts },
    ...catRows.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: countByCatId.get(cat.id) ?? 0,
    })),
  ];

  return {
    tabs,
    categories: catRows,
  };
}

// ---------------------------------------------------------------------------
// 3. Image Upload & Delete in Storage
// ---------------------------------------------------------------------------

const MAX_IMAGE_SIZE_BYTES = 819200; // 800 KB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function uploadProductImage(
  formData: FormData,
  productId: string
): Promise<ProductActionResult<string>> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: 'No image file provided' };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        message: `Image size exceeds the 800 KB limit (${(file.size / 1024).toFixed(1)} KB uploaded).`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: 'Invalid image format. Allowed formats are PNG, JPEG, and WebP.',
      };
    }

    const supabase = createServiceRoleClient();
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `${productId}/image.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('[uploadProductImage] Storage error:', uploadErr.message);
      return { success: false, message: `Failed to upload image: ${uploadErr.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    // Append cache-buster timestamp so updated images immediately render
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    return { success: true, data: publicUrl };
  } catch (err) {
    console.error('[uploadProductImage] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown image upload error',
    };
  }
}

export async function deleteProductImageFromStorage(
  imageUrl: string
): Promise<void> {
  if (!imageUrl) return;
  try {
    const supabase = createServiceRoleClient();
    // Extract path from public URL if stored in our products bucket
    // E.g.: https://.../storage/v1/object/public/products/<uuid>/image.jpg
    const match = imageUrl.match(/\/products\/(.+?)(?:\?.*)?$/);
    if (match && match[1]) {
      const objectPath = match[1];
      await supabase.storage.from('products').remove([objectPath]);
    }
  } catch (err) {
    console.warn('[deleteProductImageFromStorage] Non-critical warning:', err);
  }
}

// ---------------------------------------------------------------------------
// 4. createAdminProduct
// ---------------------------------------------------------------------------

export async function createAdminProduct(
  input: CreateProductInput,
  imageFormData?: FormData
): Promise<ProductActionResult<AdminProduct>> {
  try {
    // Validation
    const name = input.name?.trim();
    if (!name) {
      return { success: false, message: 'Product name is required.' };
    }

    if (!input.category_id) {
      return { success: false, message: 'Category is required.' };
    }

    const sellingRate = Number(input.selling_rate);
    if (isNaN(sellingRate) || sellingRate <= 0) {
      return { success: false, message: 'Selling rate must be greater than 0.' };
    }

    const marketRate =
      input.market_rate !== null && input.market_rate !== undefined && !isNaN(Number(input.market_rate))
        ? Number(input.market_rate)
        : null;

    const stock =
      input.stock !== null && input.stock !== undefined && !isNaN(Number(input.stock))
        ? Number(input.stock)
        : null;

    const lowStock =
      input.low_stock_threshold !== null &&
      input.low_stock_threshold !== undefined &&
      !isNaN(Number(input.low_stock_threshold))
        ? Number(input.low_stock_threshold)
        : null;

    const supabase = createServiceRoleClient();

    // 1. Verify category exists
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', input.category_id)
      .single();

    if (catErr || !cat) {
      return { success: false, message: 'Selected category does not exist.' };
    }

    // 2. Insert product record to obtain UUID
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert({
        category_id: input.category_id,
        name,
        tamil_name: input.tamil_name?.trim() || null,
        market_rate: marketRate,
        selling_rate: sellingRate,
        stock,
        low_stock_threshold: lowStock,
        description: input.description?.trim() || null,
        image_url: input.image_url || null,
        is_available: input.is_available ?? true,
      })
      .select('*, category:categories(id, name)')
      .single();

    if (insertErr || !inserted) {
      console.error('[createAdminProduct] Insert error:', insertErr?.message);
      return { success: false, message: insertErr?.message || 'Failed to create product.' };
    }

    let finalProduct = mapProductRow(inserted as unknown as ProductJoinRow);

    // 3. Handle image upload if provided in FormData
    if (imageFormData && imageFormData.get('file')) {
      const uploadRes = await uploadProductImage(imageFormData, inserted.id);
      if (uploadRes.success && uploadRes.data) {
        // Update product with public image URL
        const { data: updatedWithImage } = await supabase
          .from('products')
          .update({ image_url: uploadRes.data })
          .eq('id', inserted.id)
          .select('*, category:categories(id, name)')
          .single();

        if (updatedWithImage) {
          finalProduct = mapProductRow(updatedWithImage as unknown as ProductJoinRow);
        }
      }
    }

    return {
      success: true,
      message: `Product "${name}" created successfully.`,
      data: finalProduct,
    };
  } catch (err) {
    console.error('[createAdminProduct] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'An unexpected error occurred.',
    };
  }
}

// ---------------------------------------------------------------------------
// 5. updateAdminProduct
// ---------------------------------------------------------------------------

export async function updateAdminProduct(
  id: string,
  input: UpdateProductInput,
  imageFormData?: FormData
): Promise<ProductActionResult<AdminProduct>> {
  try {
    if (!id) return { success: false, message: 'Product ID is required.' };

    const supabase = createServiceRoleClient();

    // 1. Fetch existing product
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, message: 'Product not found.' };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) return { success: false, message: 'Product name cannot be empty.' };
      updates.name = name;
    }

    if (input.tamil_name !== undefined) {
      updates.tamil_name = input.tamil_name ? input.tamil_name.trim() : null;
    }

    if (input.category_id !== undefined) {
      updates.category_id = input.category_id;
    }

    if (input.market_rate !== undefined) {
      updates.market_rate =
        input.market_rate !== null && !isNaN(Number(input.market_rate))
          ? Number(input.market_rate)
          : null;
    }

    if (input.selling_rate !== undefined) {
      const rate = Number(input.selling_rate);
      if (isNaN(rate) || rate <= 0) {
        return { success: false, message: 'Selling rate must be greater than 0.' };
      }
      updates.selling_rate = rate;
    }

    if (input.stock !== undefined) {
      updates.stock =
        input.stock !== null && !isNaN(Number(input.stock))
          ? Number(input.stock)
          : null;
    }

    if (input.low_stock_threshold !== undefined) {
      updates.low_stock_threshold =
        input.low_stock_threshold !== null && !isNaN(Number(input.low_stock_threshold))
          ? Number(input.low_stock_threshold)
          : null;
    }

    if (input.description !== undefined) {
      updates.description = input.description ? input.description.trim() : null;
    }

    if (input.is_available !== undefined) {
      updates.is_available = input.is_available;
    }

    // Handle image replacement or removal
    if (imageFormData && imageFormData.get('file')) {
      // Upload new image
      const uploadRes = await uploadProductImage(imageFormData, id);
      if (uploadRes.success && uploadRes.data) {
        updates.image_url = uploadRes.data;
      }
    } else if (input.image_url !== undefined) {
      if (input.image_url === null && existing.image_url) {
        // Image was explicitly removed
        await deleteProductImageFromStorage(existing.image_url);
        updates.image_url = null;
      } else {
        updates.image_url = input.image_url;
      }
    }

    // 2. Perform DB update
    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(id, name)')
      .single();

    if (updateErr || !updated) {
      console.error('[updateAdminProduct] Update error:', updateErr?.message);
      return { success: false, message: updateErr?.message || 'Failed to update product.' };
    }

    return {
      success: true,
      message: 'Product updated successfully.',
      data: mapProductRow(updated as unknown as ProductJoinRow),
    };
  } catch (err) {
    console.error('[updateAdminProduct] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'An unexpected error occurred.',
    };
  }
}

// ---------------------------------------------------------------------------
// 6. deleteAdminProduct
// ---------------------------------------------------------------------------

export async function deleteAdminProduct(
  id: string
): Promise<ProductActionResult> {
  try {
    if (!id) return { success: false, message: 'Product ID is required.' };

    const supabase = createServiceRoleClient();

    // 1. Check if product is referenced by existing order_items
    const { count: orderItemsCount, error: countErr } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id);

    if (countErr) {
      console.error('[deleteAdminProduct] Check order items error:', countErr.message);
    }

    if (orderItemsCount && orderItemsCount > 0) {
      return {
        success: false,
        code: 'LINKED_TO_ORDERS',
        message:
          'This product cannot be deleted because it is linked to existing orders. Mark it unavailable instead.',
      };
    }

    // 2. Fetch image_url to clean up storage if present
    const { data: prod } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', id)
      .single();

    // 3. Perform physical deletion from products table
    const { error: deleteErr } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      // Check foreign key constraint violation code (23503)
      if (deleteErr.code === '23503') {
        return {
          success: false,
          code: 'LINKED_TO_ORDERS',
          message:
            'This product cannot be deleted because it is linked to existing orders. Mark it unavailable instead.',
        };
      }
      return { success: false, message: deleteErr.message };
    }

    // 4. Delete image from Storage if it was stored
    if (prod?.image_url) {
      await deleteProductImageFromStorage(prod.image_url);
    }

    return {
      success: true,
      message: 'Product deleted successfully.',
    };
  } catch (err) {
    console.error('[deleteAdminProduct] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to delete product.',
    };
  }
}

// ---------------------------------------------------------------------------
// 7. toggleProductAvailability
// ---------------------------------------------------------------------------

export async function toggleProductAvailability(
  id: string,
  is_available: boolean
): Promise<ProductActionResult> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('products')
      .update({
        is_available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Product marked as ${is_available ? 'Available' : 'Unavailable'}.`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update availability.',
    };
  }
}

// ---------------------------------------------------------------------------
// 8. Excel Validation & Bulk Import
// ---------------------------------------------------------------------------

export async function validateExcelFile(
  formData: FormData
): Promise<ProductActionResult<ExcelValidationSummary>> {
  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: 'Please select an Excel or CSV file to validate.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, message: 'The uploaded file does not contain any sheets.' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
    });

    if (rawRows.length === 0) {
      return { success: false, message: 'The uploaded worksheet contains no data rows.' };
    }

    const supabase = createServiceRoleClient();

    // 1. Fetch all real categories for normalized matching
    const { data: dbCategories, error: catErr } = await supabase
      .from('categories')
      .select('id, name');

    if (catErr || !dbCategories) {
      return { success: false, message: 'Failed to retrieve categories for validation.' };
    }

    // Build normalized lookup map: normalizedKey -> { id, canonicalName }
    const categoryMap = new Map<string, { id: string; name: string }>();
    for (const c of dbCategories) {
      categoryMap.set(normalizeCategoryKey(c.name), { id: c.id, name: c.name });
    }

    // 2. Fetch all existing products by name for update matching
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name');

    const existingProductNames = new Map<string, string>(); // lowercase name -> id
    for (const p of dbProducts ?? []) {
      existingProductNames.set(p.name.trim().toLowerCase(), p.id);
    }

    // 3. Process & validate each row
    const validatedRows: ExcelValidationRow[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let newProductsCount = 0;
    let existingProductsCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2; // Row 1 is header
      const row = rawRows[i];

      // Flexible column name matching
      const getVal = (...keys: string[]): string => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
              return String(row[rowKey]).trim();
            }
          }
        }
        return '';
      };

      const productName = getVal('Product Name', 'Product', 'Name');
      const tamilName = getVal('Tamil Name', 'Tamil') || null;
      const categoryRaw = getVal('Category', 'Category Name');
      const marketRateRaw = getVal('Market Rate', 'Market Price', 'MRP');
      const sellingRateRaw = getVal('Selling Rate', 'Our Rate', 'Price', 'Rate');
      const stockRaw = getVal('Stock', 'Current Stock', 'Quantity');
      const lowStockRaw = getVal('Low Stock Alert', 'Low Stock Threshold', 'Threshold');
      const description = getVal('Description', 'Details') || null;
      const isAvailableRaw = getVal('Availability', 'Available', 'Status');

      const errorMessages: string[] = [];

      // Validate Product Name
      if (!productName) {
        errorMessages.push('Missing required Product Name');
      }

      // Validate Category
      let matchedCategoryId: string | null = null;
      let matchedCategoryName: string | null = null;

      if (!categoryRaw) {
        errorMessages.push('Missing required Category');
      } else {
        const normCat = normalizeCategoryKey(categoryRaw);
        const match = categoryMap.get(normCat);
        if (match) {
          matchedCategoryId = match.id;
          matchedCategoryName = match.name;
        } else {
          errorMessages.push(`Unknown category "${categoryRaw}" (categories must exist in database)`);
        }
      }

      // Validate Selling Rate
      let sellingRate: number | null = null;
      if (!sellingRateRaw) {
        errorMessages.push('Missing required Selling Rate');
      } else {
        const parsedRate = parseFloat(sellingRateRaw.replace(/[^0-9.]/g, ''));
        if (isNaN(parsedRate) || parsedRate <= 0) {
          errorMessages.push(`Invalid Selling Rate "${sellingRateRaw}"`);
        } else {
          sellingRate = parsedRate;
        }
      }

      // Optional numeric fields
      let marketRate: number | null = null;
      if (marketRateRaw) {
        const parsed = parseFloat(marketRateRaw.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed >= 0) marketRate = parsed;
      }

      let stock: number | null = null;
      if (stockRaw) {
        const parsed = parseInt(stockRaw.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 0) stock = parsed;
      }

      let lowStockThreshold: number | null = null;
      if (lowStockRaw) {
        const parsed = parseInt(lowStockRaw.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 0) lowStockThreshold = parsed;
      }

      const isAvailable =
        isAvailableRaw.toLowerCase() === 'no' ||
        isAvailableRaw.toLowerCase() === 'false' ||
        isAvailableRaw.toLowerCase() === 'out of stock'
          ? false
          : true;

      // Existing product match by name
      const existingId = productName
        ? existingProductNames.get(productName.toLowerCase())
        : undefined;
      const isExisting = Boolean(existingId);

      let status: 'valid' | 'warning' | 'error' = 'valid';
      if (errorMessages.length > 0) {
        status = 'error';
        errorCount++;
      } else if (isExisting) {
        status = 'warning'; // Warning / Review indicator for existing product update
        warningCount++;
        validCount++;
        existingProductsCount++;
      } else {
        status = 'valid';
        validCount++;
        newProductsCount++;
      }

      validatedRows.push({
        rowNumber,
        productName: productName || 'Unnamed Product',
        tamilName,
        category: categoryRaw || '—',
        matchedCategoryId,
        matchedCategoryName,
        marketRate,
        sellingRate,
        stock,
        lowStockThreshold,
        description,
        isAvailable,
        status,
        errorMessages,
        isExisting,
        existingProductId: existingId,
      });
    }

    const summary: ExcelValidationSummary = {
      totalRows: rawRows.length,
      validRows: validCount,
      warningRows: warningCount,
      errorRows: errorCount,
      newProductsCount,
      existingProductsCount,
      rows: validatedRows,
    };

    return {
      success: true,
      data: summary,
    };
  } catch (err) {
    console.error('[validateExcelFile] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to parse and validate file.',
    };
  }
}

export async function importValidatedExcelProducts(
  rows: ExcelValidationRow[],
  updateExisting: boolean
): Promise<ExcelImportResult> {
  try {
    const supabase = createServiceRoleClient();
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const r of rows) {
      // Skip invalid rows
      if (r.status === 'error' || !r.matchedCategoryId || !r.sellingRate) {
        skippedCount++;
        continue;
      }

      if (r.isExisting && r.existingProductId) {
        if (!updateExisting) {
          skippedCount++;
          continue;
        }

        // Update existing product
        const { error: upErr } = await supabase
          .from('products')
          .update({
            category_id: r.matchedCategoryId,
            tamil_name: r.tamilName,
            market_rate: r.marketRate,
            selling_rate: r.sellingRate,
            stock: r.stock,
            low_stock_threshold: r.lowStockThreshold,
            description: r.description,
            is_available: r.isAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq('id', r.existingProductId);

        if (upErr) {
          errors.push(`Row #${r.rowNumber} (${r.productName}): ${upErr.message}`);
          skippedCount++;
        } else {
          updatedCount++;
        }
      } else {
        // Insert new product
        const { error: inErr } = await supabase
          .from('products')
          .insert({
            name: r.productName,
            category_id: r.matchedCategoryId,
            tamil_name: r.tamilName,
            market_rate: r.marketRate,
            selling_rate: r.sellingRate,
            stock: r.stock,
            low_stock_threshold: r.lowStockThreshold,
            description: r.description,
            is_available: r.isAvailable,
          });

        if (inErr) {
          errors.push(`Row #${r.rowNumber} (${r.productName}): ${inErr.message}`);
          skippedCount++;
        } else {
          createdCount++;
        }
      }
    }

    return {
      success: true,
      message: `Excel import completed. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}.`,
      createdCount,
      updatedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    console.error('[importValidatedExcelProducts] Exception:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Bulk import failed.',
      createdCount: 0,
      updatedCount: 0,
      skippedCount: rows.length,
    };
  }
}
