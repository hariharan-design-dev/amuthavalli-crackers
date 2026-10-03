# Phase 4 — Supabase Authentication & Row Level Security (RLS) Specification

**Project:** Amuthavalli Crackers  
**Phase:** Phase 4 — Supabase Authentication + Row Level Security  
**Status:** IMPLEMENTED (Awaiting Human Architectural Decision on Public Order Creation Mechanism)  
**Authoritative Migration:** `supabase/migrations/20261001000001_enable_rls_and_auth_policies.sql`  
**Base Schema Migration:** `supabase/migrations/20261001000000_initial_database_schema.sql` (Unchanged)  

---

## 1. Authentication Model

The application strictly distinguishes between two classes of users: **Admin** and **Customer**:

| User Type | Authentication System | Identity Storage | Credentials | Session Model |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Supabase Auth (`gotrue`) | `auth.users` | Secure email + password managed by Supabase Auth | Stateful JWT Bearer token / secure HTTP-only cookies (`@supabase/ssr`) |
| **Customer** | None (Guest Checkout) | None (No Auth records) | None (No passwords, sessions, or logins) | Stateless guest browsing & checkout submission |

- **Zero Custom Auth Tables:** No custom password tables, plaintext password columns, custom session stores, or role tables have been created.
- **Customer Auth Exclusion:** Customers never authenticate against Supabase Auth. The `customers` table stores operational delivery profiles only, indexed by unique mobile number, and contains zero credential or auth identity fields (`auth_id`, `password_hash`, etc.).

---

## 2. Admin Authentication Boundary

Administrative operations are strictly gated by Supabase Auth session validation at both the network and database layers:
1. **Database Role Enforcement:** PostgreSQL evaluates the JWT sent with each request. When an admin signs in via Supabase Auth, their request context possesses the PostgreSQL role `authenticated` (`auth.role() = 'authenticated'`).
2. **Strict RLS Filtering:** Administrative policies explicitly specify `TO authenticated`. Anonymous requests (`TO anon`) or missing credentials fail RLS checks immediately.
3. **No Frontend-Only Security:** Administrative permissions do not rely on hiding UI components, client-side route guards, or localStorage flags. Direct HTTP REST or GraphQL calls to Supabase PostgREST endpoints enforce identical RLS restrictions.
4. **Single Admin Role:** In accordance with approved Phase 2 architecture, all authenticated Supabase users are authorized store administrators. No unnecessary multi-role or hierarchical RBAC schema bloat has been added.

---

## 3. Customer Authentication Exclusion

Customers are intentionally excluded from the authentication layer:
- No customer registration endpoints or tables.
- No customer login forms or credentials.
- No customer account dashboard.
- No customer session persistence.
- Repeat customers are identified during checkout solely by their unique mobile number (`customers.mobile`) for operational contact linking, not for session authentication.

---

## 4. RLS Enabled Tables

Row Level Security is explicitly activated on **all six (6) application tables**:

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
```

**Security Default:** In PostgreSQL, enabling RLS without a matching policy enforces an automatic **Default Deny** rule. No caller can perform any action unless an explicit policy permits it.

---

## 5. Public Access Matrix (Anonymous / Anon)

| Table | SELECT | INSERT | UPDATE | DELETE | Enforcement Mechanism & Filter |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`categories`** | **YES** | NO | NO | NO | Policy `categories_public_select`: `USING (true)` |
| **`products`** | **YES** | NO | NO | NO | Policy `products_public_select_available`: `USING (is_available = true)` |
| **`business_settings`** | **YES** | NO | NO | NO | Policy `business_settings_public_select`: `USING (id = 1)` |
| **`customers`** | **NO** | NO | NO | NO | **Default Deny** (Zero public policies) |
| **`orders`** | **NO** | NO | NO | NO | **Default Deny** (Zero public policies) |
| **`order_items`** | **NO** | NO | NO | NO | **Default Deny** (Zero public policies) |

---

## 6. Admin Access Matrix (Authenticated Supabase User)

| Table | SELECT | INSERT | UPDATE | DELETE | Enforcement Mechanism & Scope |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`categories`** | **YES** | **YES** | **YES** | **YES** | Policy `categories_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |
| **`products`** | **YES** | **YES** | **YES** | **YES** | Policy `products_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |
| **`business_settings`** | **YES** | **YES** | **YES** | **YES** | Policy `business_settings_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |
| **`customers`** | **YES** | **YES** | **YES** | **YES** | Policy `customers_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |
| **`orders`** | **YES** | **YES** | **YES** | **YES** | Policy `orders_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |
| **`order_items`** | **YES** | **YES** | **YES** | **YES** | Policy `order_items_admin_all`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)` |

---

## 7. Explicit Policy Definitions

All policies are created in `supabase/migrations/20261001000001_enable_rls_and_auth_policies.sql`:

1. `categories_public_select` (categories, SELECT, anon): Allows public reading of category names for catalog navigation.
2. `categories_admin_all` (categories, ALL, authenticated): Full administrative CRUD.
3. `products_public_select_available` (products, SELECT, anon): Allows public reading of products where `is_available = true`.
4. `products_admin_all` (products, ALL, authenticated): Full administrative CRUD (can view unavailable products).
5. `business_settings_public_select` (business_settings, SELECT, anon): Allows public reading of singleton business config (`id = 1`).
6. `business_settings_admin_all` (business_settings, ALL, authenticated): Full administrative management.
7. `customers_admin_all` (customers, ALL, authenticated): Full administrative access for directory & order history.
8. `orders_admin_all` (orders, ALL, authenticated): Full administrative access for order management & price negotiation.
9. `order_items_admin_all` (order_items, ALL, authenticated): Full administrative access for line items and negotiation.

---

## 8. Security Reasoning

### 8.1 Customer Data Protection (`customers`)
- **Vulnerability Prevented:** If `anon` were granted `SELECT` access to `customers`, an attacker could scrape customer names, phone numbers, and physical addresses (PII data breach).
- **Vulnerability Prevented:** If `anon` were granted `UPDATE` access to `customers`, an attacker could overwrite existing customer contact profiles simply by guessing or passing a victim's phone number.
- **Architectural Solution:** Complete default-deny for `anon`. Customer resolution and creation during checkout is isolated from public client direct table access.

### 8.2 Order & Pricing Integrity (`orders` and `order_items`)
- **Vulnerability Prevented:** If `anon` were granted direct `INSERT` on `orders`, a malicious client could inject arbitrary order amounts (e.g. `total_amount = 0.01`), forge `order_number`, or tamper with order `status` (e.g. `status = 'Completed'`).
- **Vulnerability Prevented:** If `anon` were granted direct `INSERT` on `order_items`, a malicious client could tamper with `unit_price` (e.g. purchasing ₹500 crackers for ₹1.00).
- **Vulnerability Prevented:** If `anon` were granted `SELECT` on `orders`, attackers could enumerate and inspect other customers' orders and financial snapshots.
- **Architectural Solution:** Complete default-deny for `anon` on both `orders` and `order_items`.

### 8.3 Inactive Product Isolation (`products`)
- Deactivated products (`is_available = false`) are hidden from anonymous catalog queries via `USING (is_available = true)`. Admin users retain full visibility into all products for inventory maintenance.

---

## 9. Public Order-Creation Mechanism Analysis

### The Critical Architectural Conflict
During Phase 2, the high-level architecture diagram indicated:
`[Public Anon Client] ──> [Insert Orders & Items via Checkout]`
and:
`customers: Read/Write scoped to checkout customer resolution`

However, a strict RLS evaluation reveals that **direct public client table access cannot safely execute checkout**:
1. An anonymous client cannot lookup or update returning customers without exposing the `customers` table to PII scraping or tampering.
2. An anonymous client cannot insert orders or line items without the risk of pricing and status parameter tampering.
3. Multi-table checkout (customer resolution -> order creation -> order items insertion) executed across multiple client-side REST calls lacks transactional ACID atomicity; network interruption causes partial/orphaned records.

### Required Server-Side Order Creation Path
To preserve total security and transactional atomicity without compromising customer PII or pricing integrity, public guest checkout must be executed through a **privileged server-side mechanism**:

```
+──────────────────────────+
|  Public Customer Browser |
+─────────────┬────────────+
              │ Submits Checkout Payload (Customer Details + Cart Items)
              v
+───────────────────────────────────────────────────────────────────────────────+
|               PRIVILEGED SERVER-SIDE EXECUTION CONTEXT                        |
|                                                                               |
|  1. Validates payload using Zod (formats, required fields).                   |
|  2. Fetches `business_settings.min_order_value` and verifies order threshold. |
|  3. Queries `products.selling_rate` for each item to guarantee true pricing.  |
|  4. Resolves customer record by mobile (insert new or update current).        |
|  5. Atomically inserts `orders` (`status = 'New'`, auto `order_number`).      |
|  6. Atomically inserts `order_items` (`unit_price` strictly from catalog).     |
|  7. Returns only safe confirmation reference (`order_number`, `id`, `total`).  |
+───────────────────────────────────────────────────────────────────────────────+
```

Two architectural approaches exist for implementing this privileged execution:
- **Approach 1 (Recommended): Next.js Server Action with Supabase Service Role**
  - Checkout form submits to a Next.js Server Action (`'use server'`).
  - The Server Action runs securely on the Node.js server using a private server client initialized with `SUPABASE_SERVICE_ROLE_KEY`.
  - Service Role automatically bypasses RLS on the server; public client receives zero direct database access.
  - Zero SQL stored procedure complexity; business logic remains in TypeScript.
- **Approach 2: PostgreSQL Stored Function (`SECURITY DEFINER` RPC)**
  - A PostgreSQL function `submit_guest_order(customer_payload JSONB, items_payload JSONB)` is defined with `SECURITY DEFINER`.
  - `anon` is granted `EXECUTE` on the function.
  - The function executes customer upsert, pricing verification, and order insertion in a single PostgreSQL transaction.
  - Logic is embedded in PLpgSQL rather than TypeScript.

---

## 10. Business Settings Public Access Mechanism

The `business_settings` table contains runtime configuration:
- `business_name` (Text): Header/Footer brand name.
- `business_logo_url` (Text): Header logo image URL.
- `business_address` (Text): Footer physical store location.
- `business_mobile` (Text): Contact phone number.
- `whatsapp_number` (Text): Target number for pre-filled WhatsApp inquiry links.
- `gpay_upi_number` (Text): UPI ID/number displayed on payment screen.
- `gpay_qr_code_url` (Text): QR code image URL displayed on payment screen.
- `min_order_value` (Numeric): Minimum order amount enforced during cart checkout.

**Security Determination:**
Every single column in `business_settings` is designed to be public-facing metadata consumed directly by website UI components (Header, Footer, Checkout Validator, UPI Display, and WhatsApp Dispatch). No private administrator credentials, payment gateway secrets, or banking tokens exist in this table.
Therefore, `business_settings_public_select` (`FOR SELECT TO anon USING (id = 1)`) is completely safe and introduces zero sensitive data leakage.

---

## 11. Verification Performed

1. **Static SQL Syntax & Policy Correctness:**
   - Validated against PostgreSQL 15+ DDL and RLS specifications.
   - All `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements confirmed.
   - All 9 policy definitions verified for correct role targeting (`TO anon`, `TO authenticated`) and correct expression matching (`USING`, `WITH CHECK`).
2. **TypeScript Compilation Check:**
   - Ran `npx tsc --noEmit`. Exited with code 0 (zero errors).
3. **ESLint Code Quality Check:**
   - Ran `npm run lint`. Exited with code 0 (zero lint warnings/errors).
4. **Relational Integrity Cross-Check:**
   - Verified that Phase 3 migration `20261001000000_initial_database_schema.sql` is strictly unmodified.
   - Verified that no tables, columns, or unauthorized e-commerce structures were introduced.

---

## 12. Verification Limitations

- **Docker / Local PostgreSQL Daemon:** Docker Desktop daemon was not running on the local Windows host machine (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). Therefore, local containerized PostgreSQL test execution was not possible.
- **Remote Supabase Connection:** Remote Supabase instance credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are template placeholders in `.env.example` and have not been bound to a live production database instance yet.
- **Verification Level:** Static DDL/Policy analysis, TypeScript compilation verification, and ESLint rule validation.

---

## 13. Unresolved Issue / Human Decision Required

### Decision Area: Public Guest Order Creation Architecture
Before implementing Phase 5 (APIs / Server Actions / Order Flow), the human project owner must decide between:
- **Option 1 (Recommended): Next.js Server Action with Supabase Service Role**
  - Order creation runs via a Next.js App Router Server Action.
  - Keeps RLS default-deny on `customers`, `orders`, and `order_items` for `anon`.
  - Service Role key is kept private on the server.
- **Option 2: PostgreSQL `SECURITY DEFINER` RPC Stored Function**
  - Order creation is encapsulated in a PostgreSQL stored procedure.
  - `anon` is granted execution permissions on the RPC function.
