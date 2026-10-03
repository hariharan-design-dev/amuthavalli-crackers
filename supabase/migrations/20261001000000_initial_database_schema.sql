-- Migration: Initial Database Schema for Amuthavalli Crackers
-- Phase: Phase 3 — Supabase Database Implementation
-- Authoritative Architecture Source: docs/database-architecture.md
-- Target: PostgreSQL (Supabase)

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================
-- Master classification groups for cracker products (e.g., Sparklers, Flower Pots).
-- Managed manually by Admin.
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================
-- Master catalog of cracker products.
-- Product identity is exclusively the UUID primary key (NO SKU/code field).
-- Excel import order position is strictly for import sequence, not a SKU.
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    tamil_name TEXT,
    market_rate NUMERIC(10, 2) CHECK (market_rate >= 0),
    selling_rate NUMERIC(10, 2) NOT NULL CHECK (selling_rate > 0),
    stock INTEGER CHECK (stock >= 0),
    low_stock_threshold INTEGER CHECK (low_stock_threshold >= 0),
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);

-- ============================================================================
-- 3. CUSTOMERS TABLE
-- ============================================================================
-- Dedicated customer registry.
-- Mobile number is the UNIQUE BUSINESS IDENTIFIER.
-- Customers do NOT have login credentials, passwords, or Supabase Auth links.
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city TEXT,
    pincode VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. ORDERS SEQUENCE & TABLE
-- ============================================================================
-- Sequential counter for human-readable order numbers (format: AMU-000001).
CREATE SEQUENCE order_number_seq START WITH 1 INCREMENT BY 1;

-- Order header capturing placement transaction, customer reference,
-- and an immutable historical customer snapshot at time of order placement.
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('AMU-' || LPAD(nextval('order_number_seq')::text, 6, '0')),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_city TEXT,
    customer_pincode VARCHAR(10),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Confirmed', 'Processing', 'Completed', 'Cancelled')),
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- 5. ORDER ITEMS TABLE
-- ============================================================================
-- Line items representing specific crackers purchased in an order.
-- Preserves purchase-specific pricing and product name snapshot.
-- Admin price negotiations modify unit_price here; product master selling_rate is untouched.
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 6. BUSINESS SETTINGS TABLE
-- ============================================================================
-- Singleton runtime configuration for dynamic business details.
-- Enforces exactly one configuration record (id = 1).
CREATE TABLE business_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    business_name TEXT NOT NULL,
    business_logo_url TEXT,
    business_address TEXT NOT NULL,
    business_mobile TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    gpay_upi_number TEXT NOT NULL,
    gpay_qr_code_url TEXT,
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_value >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
