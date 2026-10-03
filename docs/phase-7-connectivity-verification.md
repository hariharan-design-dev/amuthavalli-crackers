# Phase 7 — API ↔ Supabase Connectivity & Data-Layer Verification Report

**Project:** Amuthavalli Crackers  
**Phase:** Phase 7 — Verification Phase  
**Timestamp:** 2026-10-01  
**Authoritative References:**  
- Database Architecture: `docs/database-architecture.md`  
- Auth & RLS Architecture: `docs/phase-4-auth-rls.md`  
- Storage Architecture: `docs/storage-architecture.md`  
- Phase 6A Architecture: `docs/phase-6-api-data-layer-architecture.md`  
- Migration Files: `supabase/migrations/`  

---

## Executive Summary

Phase 7 evaluates the end-to-end integration and data layer of the **Amuthavalli Crackers** application against the approved architecture across 22 verification categories.

- **Static Code, Schema, Logic & Security Audits:** **PASS** (100% compliant with approved architecture).
- **Live Supabase Remote Network Connectivity & Live Database Execution:** **BLOCKED / NOT VERIFIED** (No active Supabase connection; `.env.local` contains placeholder values; local Docker daemon is inactive).

Per Phase 7 instructions, remote verification is **NOT** claimed as passed. This report documents the exact static audit results, confirms architecture and security invariants, and identifies the missing configuration required for live execution.

---

## 1. Supabase Connection Status

| Item | Status | Finding |
| :--- | :--- | :--- |
| **Environment Configuration** | **BLOCKED** | Only `.env.example` exists. No `.env.local` or `.env` file containing live project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) is present in the workspace. |
| **Supabase CLI Link** | **BLOCKED** | Running `npx supabase status` reports `linked_project: null`. The repository is not currently linked to a remote Supabase project. |
| **Local Supabase Daemon** | **BLOCKED** | Docker Desktop engine is not running on the local host (`npipe:////./pipe/dockerDesktopLinuxEngine` unavailable). |

---

## 2. Migration Status

| Migration File | Sequence / Target | Verification Status | Notes |
| :--- | :--- | :--- | :--- |
| `20261001000000_initial_database_schema.sql` | 1 (Core Schema) | **PASS (Static)** / **NOT VERIFIED (Live DB)** | Unaltered (5,726 bytes). Defines 6 business tables and `order_number_seq`. |
| `20261001000001_enable_rls_and_auth_policies.sql` | 2 (RLS & Auth) | **PASS (Static)** / **NOT VERIFIED (Live DB)** | Unaltered (4,894 bytes). Enforces default-deny on orders/customers/items. |
| `20261001000002_create_storage_infrastructure.sql` | 3 (Storage) | **PASS (Static)** / **NOT VERIFIED (Live DB)** | Unaltered (3,389 bytes). Buckets `products` and `business` with 800 KB limit. |
| `20261001000003_add_order_idempotency_and_transaction_fn.sql` | 4 (Idempotency & RPC) | **PASS (Static)** / **NOT VERIFIED (Live DB)** | Unaltered (7,847 bytes). Adds `idempotency_key` and `create_guest_order`. |

---

## 3. Database Schema Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Exactly six (6) approved business tables are defined:
    1. `categories`
    2. `products`
    3. `customers`
    4. `orders`
    5. `order_items`
    6. `business_settings`
  - **Zero Unauthorized Tables:** No payment, transaction, shipping, delivery, discount, coupon, cart, wishlist, customer account, or invoice tables exist.

---

## 4. Constraint Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - `categories`: `name TEXT NOT NULL UNIQUE`.
  - `products`: `category_id REFERENCES categories(id) ON DELETE RESTRICT`, `CHECK (selling_rate > 0)`, `CHECK (market_rate >= 0)`, `CHECK (stock >= 0)`, `is_available BOOLEAN NOT NULL DEFAULT true`.
  - `customers`: `mobile VARCHAR(15) NOT NULL UNIQUE`, `name TEXT NOT NULL`, `address TEXT NOT NULL`.
  - `orders`: `order_number VARCHAR(20) NOT NULL UNIQUE`, `idempotency_key UUID NOT NULL UNIQUE`, `customer_id REFERENCES customers(id) ON DELETE RESTRICT`, `CHECK (status IN ('New', 'Confirmed', 'Processing', 'Completed', 'Cancelled'))`, `CHECK (total_quantity > 0)`, `CHECK (total_amount >= 0)`.
  - `order_items`: `order_id REFERENCES orders(id) ON DELETE CASCADE`, `product_id REFERENCES products(id) ON DELETE RESTRICT`, `CHECK (quantity > 0)`, `CHECK (unit_price >= 0)`, `CHECK (total_price >= 0)`.
  - `business_settings`: Singleton constraint `CHECK (id = 1)`.

---

## 5. RLS Verification — Public Customer

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - **Public Allowed Reads:**
    - `categories`: `categories_public_select` allows `SELECT TO anon USING (true)`.
    - `products`: `products_public_select_available` allows `SELECT TO anon USING (is_available = true)`. Unavailable items are strictly hidden.
    - `business_settings`: `business_settings_public_select` allows `SELECT TO anon USING (id = 1)`.
  - **Public Denied Writes:**
    - `customers`, `orders`, `order_items` have zero policies for `anon` (Default Deny on `SELECT`, `INSERT`, `UPDATE`, `DELETE`).
    - `create_guest_order` function explicitly revokes `EXECUTE` from `PUBLIC` and `anon`.

---

## 6. RLS Verification — Admin

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - All six tables specify full administrative management policies (`FOR ALL TO authenticated USING (true) WITH CHECK (true)`).
  - Admin access is protected via Supabase Auth session tokens (`authenticated` role).
  - No custom password storage or custom role tables exist.

---

## 7. Storage Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Exactly two (2) approved buckets: `products` and `business`.
  - Public read enabled (`public: true`).
  - Hard file size limit: `819200` bytes (800 KB).
  - Allowed MIME types strictly limited: `ARRAY['image/png', 'image/jpeg', 'image/webp']`.
  - Disallowed types (SVG, GIF, BMP, TIFF, PDF, video) rejected at bucket level.
  - Anonymous writes, updates, and deletes denied; Admin writes allowed via authenticated RLS.

---

## 8. Business Settings Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Exactly one singleton row supported (`id = 1`).
  - Captures: `business_name`, `business_logo_url`, `business_address`, `business_mobile`, `whatsapp_number`, `gpay_upi_number`, `gpay_qr_code_url`, `min_order_value`.
  - Zero extraneous or generic configuration fields.

---

## 9. Guest Order Flow Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Guest checkout executes strictly through Server Action `submitGuestOrder` in `src/actions/order.ts`.
  - Flow: Zod input validation $\to$ Server-side duplicate merge $\to$ Catalog verification $\to$ Selling rate lookup $\to$ Financial recalculation $\to$ Minimum order threshold check $\to$ Database transaction function $\to$ Customer resolution $\to$ Order & items creation $\to$ Safe customer response.
  - Browser has zero direct table insert permissions.

---

## 10. Duplicate Product Merge Verification

- **Status:** **PASS**
- **Audit Findings:**
  - `src/actions/order.ts` implements server-side normalization using `mergedItemMap`.
  - Duplicate product UUIDs are aggregated and their quantities summed.
  - **Post-Merge Quantity Limit:** If merged quantity $> 1,000$ units, the order is rejected with `VALIDATION_ERROR` ("Total combined quantity for a single product cannot exceed 1,000 units"). No silent capping occurs.
  - Exactly one `order_item` row is produced per unique product.

---

## 11. Trusted Price Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Client-submitted prices, discounts, and totals are completely discarded.
  - Server Action queries `products.selling_rate` directly from the database and calculates line totals (`unit_price * quantity`) and order totals server-side.

---

## 12. Availability Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Server Action queries `is_available` for all requested product UUIDs.
  - If any product has `is_available = false`, the action immediately halts and returns `PRODUCT_UNAVAILABLE` ("Item '{name}' is currently out of stock or unavailable").

---

## 13. Minimum Order Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Reads `business_settings.min_order_value` from database row `id = 1`.
  - If `calculatedTotalAmount < minOrderValue`, order creation is rejected with `MIN_ORDER_NOT_MET`.

---

## 14. Customer Resolution Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Mobile number is the unique business identifier.
  - Inside `create_guest_order`:
    ```sql
    INSERT INTO customers (name, mobile, address, city, pincode)
    VALUES (...)
    ON CONFLICT (mobile) DO UPDATE ...
    RETURNING id INTO v_customer_id;
    ```
  - Seamlessly creates new customer record or updates existing profile on mobile match without race conditions.
  - Historical snapshot on `orders` preserves order-time contact details independently.

---

## 15. Idempotency Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Schema enforces `orders.idempotency_key UUID NOT NULL UNIQUE`.
  - `create_guest_order` checks for existing key at entry and catches `unique_violation` (SQLSTATE `23505`) on concurrent conflicts, safely returning the already committed order.
  - Sequence gaps on concurrent conflicts are documented and recognized as expected PostgreSQL behavior.

---

## 16. Transaction Atomicity Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - Multi-table write (customer upsert, order header, line items) is wrapped in the single PL/pgSQL function `create_guest_order`.
  - Single database transaction guarantees all-or-nothing execution; no partial or orphaned orders can be committed.

---

## 17. Order Status Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Initial status is hardcoded to `'New'`.
  - Domain strictly restricted to: `'New' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled'`.
  - Zero references to `Packed`, `Delivered`, `Paid`, or `Shipped`.

---

## 18. Payment Exclusion Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Zero payment gateways, payment transaction tables, or payment statuses exist.
  - GPay/UPI is strictly display-only metadata stored in `business_settings`.

---

## 19. Shipping Exclusion Verification

- **Status:** **PASS**
- **Audit Findings:**
  - Zero shipping tables, courier APIs, freight charges, or delivery statuses exist.

---

## 20. Service Role Security Verification

- **Status:** **PASS**
- **Audit Findings:**
  - `SUPABASE_SERVICE_ROLE_KEY` is loaded strictly on the server in `src/lib/supabase/service-role.ts`.
  - Client initialized with `persistSession: false, autoRefreshToken: false`.
  - Only imported in server-only Server Actions (`'use server'`).
  - Never exposed via `NEXT_PUBLIC_`, never bundled into browser client code, never included in API responses or logs.

---

## 21. Snapshot Integrity Verification

- **Status:** **PASS (Static)** / **NOT VERIFIED (Live DB)**
- **Audit Findings:**
  - `orders` captures immutable customer snapshot: `customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`.
  - `order_items` captures immutable product snapshot: `product_name`, `unit_price`, `total_price`.
  - Future catalog updates or customer profile edits cannot alter historical order data.

---

## 22. Failed Tests / Limitations

| Category | Limitation / Blocker | Detail |
| :--- | :--- | :--- |
| **Live Remote Database** | **NOT VERIFIED** | No active remote Supabase project is connected. Live network calls cannot be executed. |
| **Live Remote Storage** | **NOT VERIFIED** | Bucket creation and live upload tests cannot be verified over network until project is linked. |
| **Live Auth Session** | **NOT VERIFIED** | Live Admin JWT session cannot be generated without an active Supabase project. |

---

## 23. Exact Files Changed in Phase 7

- `docs/phase-7-connectivity-verification.md` *(Created)*

---

## Final Verification Assessment

```
Static Architecture, Code Quality & Security:  100% PASS (All Invariants Verified)
Live Remote Database & Supabase Connectivity:  BLOCKED / NOT VERIFIED (Missing Live Credentials)
```

**Status:**
# PHASE 7 BLOCKED — HUMAN DECISION REQUIRED
*(Awaiting user-provided Supabase project configuration / credentials to execute live database and storage verification).*
