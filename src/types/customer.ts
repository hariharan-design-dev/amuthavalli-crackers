/**
 * Authoritative Customer & Admin Customer Types
 * Amuthavalli Crackers — Admin Customers Real Data Integration
 *
 * Source of Truth: Supabase customers, orders tables
 * Strictly adheres to authoritative schema:
 * - Customer: id, name, mobile, address, city, pincode, created_at, updated_at
 * - Zero unsupported fields (no customer status, no alternateNumber, no landmark, no payment/shipping status).
 */

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  city: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  mobile: string;
  address: string;
  city: string | null;
  pincode: string | null;
  fullAddress: string;
  created_at: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  avatarColor: string;
}

export type OrderStatus = "New" | "Confirmed" | "Processing" | "Completed" | "Cancelled";

export interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  status: OrderStatus;
}

export interface CustomerAdminMetrics {
  totalCustomers: {
    value: string;
    trend: string;
    trendText: string;
  };
  totalOrders: {
    value: string;
    trend: string;
    trendText: string;
  };
  totalOrderValue: {
    value: string;
    trend: string;
    trendText: string;
  };
  newCustomers: {
    value: string;
    trend: string;
    trendText: string;
  };
}

export interface CustomerActionResult<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  details?: Record<string, string[]>;
}
