-- Migration: Create Storage Infrastructure and Policies for Amuthavalli Crackers
-- Phase: Phase 5 — Supabase Storage Implementation
-- Authoritative Architecture Source: docs/storage-architecture.md
-- Target: PostgreSQL / Supabase Storage (storage schema)

-- ============================================================================
-- 1. BUCKET CREATION & CONFIGURATION
-- ============================================================================
-- Exactly two approved buckets: 'products' and 'business'.
-- Bucket configuration parameters:
-- - public: true (public read access for customer-facing web assets)
-- - file_size_limit: 819200 bytes (800 KB hard limit across all assets: 800 * 1024)
-- - allowed_mime_types: image/png, image/jpeg, image/webp (strictly enforced at bucket level)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'products',
        'products',
        true,
        819200,
        ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
    ),
    (
        'business',
        'business',
        true,
        819200,
        ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE OBJECT RLS POLICIES — PRODUCTS BUCKET
-- ============================================================================
-- Scoped strictly to bucket_id = 'products'.
-- Anonymous public users: SELECT/read only (for product catalog display).
-- Authenticated admin users: Full write/update/delete management.

-- 2.1 Public Read Policy
CREATE POLICY "products_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- 2.2 Admin Insert Policy
CREATE POLICY "products_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- 2.3 Admin Update Policy
CREATE POLICY "products_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- 2.4 Admin Delete Policy
CREATE POLICY "products_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- ============================================================================
-- 3. STORAGE OBJECT RLS POLICIES — BUSINESS BUCKET
-- ============================================================================
-- Scoped strictly to bucket_id = 'business'.
-- Anonymous public users: SELECT/read only (for website logo & GPay payment QR).
-- Authenticated admin users: Full write/update/delete management.

-- 3.1 Public Read Policy
CREATE POLICY "business_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business');

-- 3.2 Admin Insert Policy
CREATE POLICY "business_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business');

-- 3.3 Admin Update Policy
CREATE POLICY "business_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business')
WITH CHECK (bucket_id = 'business');

-- 3.4 Admin Delete Policy
CREATE POLICY "business_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business');
