/**
 * Authoritative Admin Order Types
 * Amuthavalli Crackers — Admin Orders Real Data Integration
 *
 * Source of Truth: Supabase orders, order_items tables
 *
 * Strictly adheres to authoritative schema. Zero unsupported fields:
 * - No payment status, no shipping status, no tracking, no discount, no GST.
 * - Historical customer snapshot fields (customer_name, customer_phone,
 *   customer_address, customer_city, customer_pincode) are the order record.
 *   They are NEVER overwritten with current customer profile.
 * - items_count is derived server-side from COUNT(order_items).
 * - package_type does NOT exist in order_items schema — omitted.
 */

export type AdminOrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  tamil_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  invoice_token: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string | null;
  customer_pincode: string | null;
  status: AdminOrderStatus;
  /** Number of distinct product lines (derived: COUNT(order_items)) */
  items_count: number;
  total_quantity: number;
  total_amount: number;
  notes: string | null;
  created_at: string; // ISO timestamp from DB — formatted for display in components
  /** Pre-formatted display string, e.g. "02 Oct 2026, 11:42 AM" */
  created_at_display: string;
  /** Lazily loaded order items; populated only when order panel opens */
  items: AdminOrderItem[];
}

export interface OrderStatusTabConfig {
  id: string; // 'all' | AdminOrderStatus
  label: string;
  count: number;
}

export interface OrdersAdminMetrics {
  totalOrders: {
    value: string;
    trend: string;
    trendText: string;
  };
  newOrders: {
    value: string;
    trend: string;
    trendText: string;
  };
  processingOrders: {
    value: string;
    trend: string;
    trendText: string;
  };
  completedOrders: {
    value: string;
    trend: string;
    trendText: string;
  };
}

export interface GetOrdersResult {
  orders: AdminOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
