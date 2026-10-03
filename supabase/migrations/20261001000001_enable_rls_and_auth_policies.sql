-- Migration: Enable Row Level Security and Authentication Policies for Amuthavalli Crackers
-- Phase: Phase 4 — Supabase Authentication + Row Level Security
-- Authoritative Architecture Source: docs/database-architecture.md
-- Target: PostgreSQL (Supabase)

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL SIX APPLICATION TABLES
-- ============================================================================
-- Enforces zero default access; all access must be explicitly granted by policies.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CATEGORIES POLICIES
-- ============================================================================
-- Public: Read-only access to all categories for catalog browsing and navigation.
CREATE POLICY "categories_public_select"
ON categories
FOR SELECT
TO anon
USING (true);

-- Admin: Full administrative management (SELECT, INSERT, UPDATE, DELETE).
CREATE POLICY "categories_admin_all"
ON categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 3. PRODUCTS POLICIES
-- ============================================================================
-- Public: Read-only access strictly restricted to currently available products.
-- Inactive/unavailable products (is_available = false) are hidden from the public.
CREATE POLICY "products_public_select_available"
ON products
FOR SELECT
TO anon
USING (is_available = true);

-- Admin: Full administrative management (SELECT, INSERT, UPDATE, DELETE).
-- Authenticated admins can view both available and unavailable products.
CREATE POLICY "products_admin_all"
ON products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. BUSINESS SETTINGS POLICIES
-- ============================================================================
-- Public: Read-only access to the singleton business settings record (id = 1)
-- for public website branding, contact numbers, UPI QR code, and min order threshold.
CREATE POLICY "business_settings_public_select"
ON business_settings
FOR SELECT
TO anon
USING (id = 1);

-- Admin: Full administrative management (SELECT, INSERT, UPDATE, DELETE).
CREATE POLICY "business_settings_admin_all"
ON business_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. CUSTOMERS POLICIES
-- ============================================================================
-- Public / Anon: NO POLICIES DEFINED (Default Deny).
-- Direct public client SELECT, INSERT, UPDATE, and DELETE are strictly blocked.
-- Prevents harvesting of customer PII (mobile numbers, delivery addresses) and profile tampering.
-- Customer creation and resolution during checkout is delegated to a privileged server-side mechanism.

-- Admin: Full administrative access for customer directory and order history inspection.
CREATE POLICY "customers_admin_all"
ON customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. ORDERS POLICIES
-- ============================================================================
-- Public / Anon: NO POLICIES DEFINED (Default Deny).
-- Direct public client SELECT, INSERT, UPDATE, and DELETE are strictly blocked.
-- Prevents price forgery, arbitrary order status injection, and order data enumeration.
-- Order creation during checkout is delegated to a privileged server-side mechanism.

-- Admin: Full administrative management for order review, price negotiation, and status updates.
CREATE POLICY "orders_admin_all"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 7. ORDER ITEMS POLICIES
-- ============================================================================
-- Public / Anon: NO POLICIES DEFINED (Default Deny).
-- Direct public client SELECT, INSERT, UPDATE, and DELETE are strictly blocked.
-- Prevents client-side forging of unit_price and total_price.
-- Order item creation during checkout is delegated to a privileged server-side mechanism.

-- Admin: Full administrative management for line-item price negotiation and order item inspection.
CREATE POLICY "order_items_admin_all"
ON order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
