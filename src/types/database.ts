/**
 * Database Entity Types for Amuthavalli Crackers
 * Phase: Phase 8 — Frontend Foundation
 * Reference: docs/database-architecture.md & supabase/migrations/
 *
 * Strictly adheres to approved schema columns.
 * Zero unapproved fields (no SKU, no payment status, no shipping calculations).
 */

export interface Category {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  tamil_name: string | null;
  market_rate: number | null;
  selling_rate: number;
  stock: number | null;
  low_stock_threshold: number | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  city: string | null;
  pincode: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessSettings {
  id: 1;
  business_name: string | null;
  business_logo_url: string | null;
  business_address: string | null;
  business_mobile: string | null;
  reach_us_number: string | null;
  whatsapp_number: string | null;
  gpay_upi_numbers: string[];
  gpay_qr_code_url: string | null;
  min_order_value: number;
  updated_at?: string;
}

export interface DbOrder {
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
  idempotency_key: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

