'use server';

/**
 * Server Actions: Admin Orders Real Data Integration
 * Phase: Stage 2B — Implementation
 * Source of Truth: Supabase orders, order_items tables
 *
 * Enforces:
 * - Server-authoritative data access (zero browser service-role key exposure)
 * - Server-side pagination, search, and time-based filtering
 * - Historical customer snapshot fields used — NOT current customer profile
 * - Locked order statuses: New | Confirmed | Processing | Completed | Cancelled
 * - No payment status, shipping, tracking, discount, or GST
 */

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  UpdateAdminOrderSchema,
  type UpdateAdminOrderResult,
} from '@/lib/validations/admin-order';
import type {
  AdminOrder,
  AdminOrderItem,
  AdminOrderStatus,
  OrderStatusTabConfig,
  OrdersAdminMetrics,
  GetOrdersResult,
} from '@/types/admin-order';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatOrderDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${day} ${month} ${year}, ${hour12}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

function getTimeFilterBoundary(timeFilter: string): Date | null {
  const now = new Date();
  switch (timeFilter) {
    case 'Today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'Yesterday': {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'Last 7 Days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return start;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Row shape returned by Supabase select
// ---------------------------------------------------------------------------

interface OrderRow {
  id: string;
  order_number: string;
  invoice_token: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string | null;
  customer_pincode: string | null;
  status: string;
  total_quantity: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  items_count: [{ count: string }];
}

function mapOrderRow(row: OrderRow): AdminOrder {
  const itemsCountRaw = row.items_count;
  const itemsCount =
    Array.isArray(itemsCountRaw) && itemsCountRaw.length > 0
      ? parseInt(String(itemsCountRaw[0]?.count ?? '0'), 10)
      : 0;

  return {
    id: row.id,
    order_number: row.order_number,
    invoice_token: row.invoice_token,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    customer_city: row.customer_city,
    customer_pincode: row.customer_pincode,
    status: row.status as AdminOrderStatus,
    items_count: itemsCount,
    total_quantity: row.total_quantity,
    total_amount: Number(row.total_amount),
    notes: row.notes,
    created_at: row.created_at,
    created_at_display: formatOrderDate(row.created_at),
    items: [],
  };
}

// ---------------------------------------------------------------------------
// Params interfaces
// ---------------------------------------------------------------------------

export interface GetOrdersParams {
  searchQuery?: string;
  statusFilter?: string; // 'all' | AdminOrderStatus
  timeFilter?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// getAdminOrders
// ---------------------------------------------------------------------------

export async function getAdminOrders(
  params: GetOrdersParams = {}
): Promise<GetOrdersResult> {
  const {
    searchQuery = '',
    statusFilter = 'all',
    timeFilter = 'All Time',
    page = 1,
    pageSize = 10,
  } = params;

  const supabase = createServiceRoleClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const boundary = getTimeFilterBoundary(timeFilter);

  let query = supabase
    .from('orders')
    .select(
      `id, order_number, invoice_token, customer_id, customer_name, customer_phone,
       customer_address, customer_city, customer_pincode, status,
       total_quantity, total_amount, notes, created_at,
       items_count:order_items(count)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  // Status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Time filter
  if (boundary) {
    if (timeFilter === 'Yesterday') {
      // Yesterday: from start of yesterday to start of today
      const endOfYesterday = new Date(boundary);
      endOfYesterday.setDate(endOfYesterday.getDate() + 1);
      query = query
        .gte('created_at', boundary.toISOString())
        .lt('created_at', endOfYesterday.toISOString());
    } else {
      query = query.gte('created_at', boundary.toISOString());
    }
  }

  // Search: order_number, customer_name, customer_phone
  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    const escapedSearch = trimmedSearch.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(
      `order_number.ilike.%${escapedSearch}%,customer_name.ilike.%${escapedSearch}%,customer_phone.ilike.%${escapedSearch}%`
    );
  }

  // Pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getAdminOrders] Supabase error:', error.message);
    return { orders: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const rows = (data ?? []) as unknown as OrderRow[];
  const orders = rows.map(mapOrderRow);

  return { orders, totalCount, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// getAdminOrderStats
// ---------------------------------------------------------------------------

export interface AdminOrderStats {
  metrics: OrdersAdminMetrics;
  tabs: OrderStatusTabConfig[];
}

export async function getAdminOrderStats(): Promise<AdminOrderStats> {
  const supabase = createServiceRoleClient();

  // Fetch all orders — only id, status, total_amount, created_at
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at');

  if (error) {
    console.error('[getAdminOrderStats] Supabase error:', error.message);
    const empty = { value: '0', trend: '—', trendText: 'vs last month' };
    return {
      metrics: {
        totalOrders: empty,
        newOrders: empty,
        processingOrders: empty,
        completedOrders: empty,
      },
      tabs: [
        { id: 'all', label: 'All Orders', count: 0 },
        { id: 'New', label: 'New', count: 0 },
        { id: 'Confirmed', label: 'Confirmed', count: 0 },
        { id: 'Processing', label: 'Processing', count: 0 },
        { id: 'Completed', label: 'Completed', count: 0 },
        { id: 'Cancelled', label: 'Cancelled', count: 0 },
      ],
    };
  }

  const rows = allOrders ?? [];

  // Compute current month boundary and previous month boundary for trends
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthOrders = rows.filter(
    (r) => new Date(r.created_at) >= currentMonthStart
  );
  const previousMonthOrders = rows.filter(
    (r) =>
      new Date(r.created_at) >= previousMonthStart &&
      new Date(r.created_at) < currentMonthStart
  );

  // Status counts (all time)
  const countByStatus = (status: string) =>
    rows.filter((r) => r.status === status).length;

  // Trend helper: percentage change vs last month
  function computeTrend(currentCount: number, previousCount: number): string {
    if (previousCount === 0) return currentCount > 0 ? '↑ New' : '—';
    const delta = ((currentCount - previousCount) / previousCount) * 100;
    if (Math.abs(delta) < 0.5) return '→ 0%';
    return delta > 0
      ? `↑ ${Math.round(delta)}%`
      : `↓ ${Math.round(Math.abs(delta))}%`;
  }

  // Total Orders
  const totalCurrent = currentMonthOrders.length;
  const totalPrevious = previousMonthOrders.length;

  // New orders
  const newCurrent = currentMonthOrders.filter((r) => r.status === 'New').length;
  const newPrevious = previousMonthOrders.filter((r) => r.status === 'New').length;

  // Processing orders
  const processingCurrent = currentMonthOrders.filter(
    (r) => r.status === 'Processing'
  ).length;
  const processingPrevious = previousMonthOrders.filter(
    (r) => r.status === 'Processing'
  ).length;

  // Completed orders
  const completedCurrent = currentMonthOrders.filter(
    (r) => r.status === 'Completed'
  ).length;
  const completedPrevious = previousMonthOrders.filter(
    (r) => r.status === 'Completed'
  ).length;

  const metrics: OrdersAdminMetrics = {
    totalOrders: {
      value: String(rows.length),
      trend: computeTrend(totalCurrent, totalPrevious),
      trendText: 'vs last month',
    },
    newOrders: {
      value: String(countByStatus('New')),
      trend: computeTrend(newCurrent, newPrevious),
      trendText: 'vs last month',
    },
    processingOrders: {
      value: String(countByStatus('Processing')),
      trend: computeTrend(processingCurrent, processingPrevious),
      trendText: 'vs last month',
    },
    completedOrders: {
      value: String(countByStatus('Completed')),
      trend: computeTrend(completedCurrent, completedPrevious),
      trendText: 'vs last month',
    },
  };

  const tabs: OrderStatusTabConfig[] = [
    { id: 'all', label: 'All Orders', count: rows.length },
    { id: 'New', label: 'New', count: countByStatus('New') },
    { id: 'Confirmed', label: 'Confirmed', count: countByStatus('Confirmed') },
    { id: 'Processing', label: 'Processing', count: countByStatus('Processing') },
    { id: 'Completed', label: 'Completed', count: countByStatus('Completed') },
    { id: 'Cancelled', label: 'Cancelled', count: countByStatus('Cancelled') },
  ];

  return { metrics, tabs };
}

// ---------------------------------------------------------------------------
// getOrderItems
// ---------------------------------------------------------------------------

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  tamil_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function getOrderItems(
  orderId: string
): Promise<AdminOrderItem[]> {
  if (!orderId) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, product_name, tamil_name, quantity, unit_price, total_price')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getOrderItems] Supabase error:', error.message);
    return [];
  }

  return (data ?? []).map((row: OrderItemRow) => ({
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    product_name: row.product_name,
    tamil_name: row.tamil_name ?? null,
    quantity: row.quantity,
    unit_price: Number(row.unit_price),
    total_price: Number(row.total_price),
  }));
}

// ---------------------------------------------------------------------------
// updateAdminOrder
// ---------------------------------------------------------------------------

/**
 * Updates a specific order's customer snapshot and item quantities/rates.
 *
 * Strict Invariants:
 * - Completed and Cancelled orders CANNOT be edited.
 * - Modifies ONLY the selected order and its existing order_items.
 * - Customer Master (customers table) is NEVER modified.
 * - Product Master (products table) is NEVER modified.
 * - Line item composition is locked (no adding/removing items).
 * - Total quantities and total amounts are recalculated server-side.
 */
export async function updateAdminOrder(
  orderId: string,
  input: unknown
): Promise<UpdateAdminOrderResult> {
  if (!orderId) {
    return { success: false, message: 'Order ID is required' };
  }

  // 1. Validate payload
  const parseResult = UpdateAdminOrderSchema.safeParse(input);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message ?? 'Validation failed';
    return { success: false, message: firstError };
  }

  const payload = parseResult.data;
  const supabase = createServiceRoleClient();

  try {
    // 2. Fetch existing order to verify existence and status constraint
    const { data: existingOrder, error: orderFetchErr } = await supabase
      .from('orders')
      .select('id, order_number, invoice_token, status')
      .eq('id', orderId)
      .single();

    if (orderFetchErr || !existingOrder) {
      console.error('[updateAdminOrder] Order not found:', orderFetchErr);
      return { success: false, message: 'Order not found' };
    }

    // 3. Status Constraint Check: Completed and Cancelled cannot be edited
    if (existingOrder.status === 'Completed' || existingOrder.status === 'Cancelled') {
      return {
        success: false,
        message: `Order #${existingOrder.order_number} is ${existingOrder.status} and cannot be edited.`,
      };
    }

    // 4. Fetch existing order items to verify exact matching line items
    const { data: existingItems, error: itemsFetchErr } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name, tamil_name, quantity, unit_price, total_price')
      .eq('order_id', orderId);

    if (itemsFetchErr || !existingItems) {
      console.error('[updateAdminOrder] Error fetching items:', itemsFetchErr);
      return { success: false, message: 'Unable to retrieve existing items for this order' };
    }

    // 5. Line composition invariant: Ensure all existing item IDs match payload exactly
    if (payload.items.length !== existingItems.length) {
      return {
        success: false,
        message: 'Cannot add or remove items. All existing order items must remain in the bill.',
      };
    }

    const existingItemMap = new Map(existingItems.map((item) => [item.id, item]));
    for (const item of payload.items) {
      if (!existingItemMap.has(item.id)) {
        return {
          success: false,
          message: 'Invalid item ID found in payload. Modifying item composition is not allowed.',
        };
      }
    }

    // 6. Recalculate server-authoritative line totals and grand totals
    let recalculatedTotalQuantity = 0;
    let recalculatedTotalAmount = 0;

    const itemsToUpdate = payload.items.map((item) => {
      const unitPrice = Number(item.unit_price.toFixed(2));
      const lineTotal = Number((item.quantity * unitPrice).toFixed(2));
      recalculatedTotalQuantity += item.quantity;
      recalculatedTotalAmount += lineTotal;

      return {
        id: item.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
      };
    });

    recalculatedTotalAmount = Number(recalculatedTotalAmount.toFixed(2));

    // 7. Update orders table (customer snapshot, recalculated totals, updated_at timestamp)
    const { error: orderUpdateErr } = await supabase
      .from('orders')
      .update({
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        customer_address: payload.customer_address,
        customer_city: payload.customer_city ?? null,
        customer_pincode: payload.customer_pincode ?? null,
        total_quantity: recalculatedTotalQuantity,
        total_amount: recalculatedTotalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateErr) {
      console.error('[updateAdminOrder] Error updating order:', orderUpdateErr);
      return { success: false, message: 'Failed to update order details' };
    }

    // 8. Update each order item in order_items table
    for (const item of itemsToUpdate) {
      const { error: itemUpdateErr } = await supabase
        .from('order_items')
        .update({
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })
        .eq('id', item.id)
        .eq('order_id', orderId);

      if (itemUpdateErr) {
        console.error('[updateAdminOrder] Error updating order item:', itemUpdateErr);
        return { success: false, message: 'Failed to update one or more order items' };
      }
    }

    // 9. Revalidate relevant Next.js cache paths
    revalidatePath('/admin/orders');
    revalidatePath(`/invoice/${existingOrder.invoice_token}`);

    // 10. Fetch and return freshly updated complete order record
    const { data: updatedOrderRow, error: refreshErr } = await supabase
      .from('orders')
      .select(
        `id, order_number, invoice_token, customer_id, customer_name, customer_phone,
         customer_address, customer_city, customer_pincode, status,
         total_quantity, total_amount, notes, created_at,
         items_count:order_items(count)`
      )
      .eq('id', orderId)
      .single();

    if (refreshErr || !updatedOrderRow) {
      return { success: true, message: 'Order updated successfully' };
    }

    const updatedOrder = mapOrderRow(updatedOrderRow as unknown as OrderRow);
    const updatedItems = await getOrderItems(orderId);
    updatedOrder.items = updatedItems;

    return {
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    };
  } catch (err: unknown) {
    console.error('[updateAdminOrder] Unexpected error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'An unexpected error occurred while updating the order',
    };
  }
}

