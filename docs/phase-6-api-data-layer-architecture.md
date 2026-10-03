# Phase 6A — API & Backend Data-Layer Architecture Specification

**Project:** Amuthavalli Crackers  
**Phase:** Phase 6A — API / Backend Data-Layer Architecture (Corrected & Finalized)  
**Status:** ARCHITECTURE & DATA-FLOW SPECIFICATION — DECISIONS RESOLVED  
**Authoritative References:**  
- Database Architecture: `docs/database-architecture.md`  
- Auth & RLS Architecture: `docs/phase-4-auth-rls.md`  
- Storage Architecture: `docs/storage-architecture.md`  

---

## 1. Scope & Backend Architecture

This document defines the **backend data-access, API, and data-flow architecture** for the **Amuthavalli Crackers** web application.

It specifies how the Next.js App Router application tier interacts with the approved Supabase PostgreSQL database, Supabase Auth, and Supabase Storage services while preserving the locked security, RLS, pricing integrity, and transaction boundaries.

### 1.1 Architectural Tier Separation

```
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                          CLIENT TIER                                              |
|                                                                                                   |
|   +------------------------------------+               +--------------------------------------+   |
|   |         CUSTOMER BROWSER           |               |          ADMIN DASHBOARD             |   |
|   |  - Unauthenticated Guest           |               |  - Authenticated Admin               |   |
|   |  - Catalog browsing & local cart   |               |  - Supabase Auth Session (JWT)       |   |
|   |  - Checkout form submission        |               |  - Master data & order management    |   |
|   |  - Client-side idempotency key     |               |  - Price negotiation interface       |   |
|   +-----------------+------------------+               +------------------+-------------------+   |
+─────────────────────|─────────────────────────────────────────────────────|───────────────────────+
                      │ (Server Action Invocation)                          │ (Authenticated Client)
                      v                                                     v
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                      NEXT.JS APPLICATION TIER                                     |
|                                                                                                   |
|   +────────────────────────────────────+               +──────────────────────────────────────+   |
|   |       SERVER ACTIONS (Guest)       |               |       SERVER ACTIONS / SSR (Admin)   |   |
|   |  - Executes on Node.js Server      |               |  - Validates Supabase Auth Session   |   |
|   |  - Zod Schema Validation           |               |  - Scoped to `authenticated` role    |   |
|   |  - Server-side Price Recomputation |               |  - Enforces Phase 4 Admin RLS        |   |
|   |  - Private Server Client           |               |  - Master CRUD & Price Negotiation   |   |
|   |    (`SUPABASE_SERVICE_ROLE_KEY`)   |               |                                      |   |
|   +-----------------+------------------+               +------------------+-------------------+   |
+─────────────────────|─────────────────────────────────────────────────────|───────────────────────+
                      │ (RPC: `create_guest_order` via service_role)        │ (User JWT: Admin RLS)
                      v                                                     v
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                     SUPABASE BACKEND SERVICES                                     |
|                                                                                                   |
|   +───────────────────────────────────────────────────────────────────────────────────────────+   |
|   |                                POSTGRESQL DATABASE & RLS                                  |   |
|   |   - `categories`, `products`, `business_settings`: Public Read (Anon) / Admin Write       |   |
|   |   - `customers`, `orders`, `order_items`: RLS Default-Deny (Anon) / Admin Full Access     |   |
|   |   - Atomic Order Number Generation via Sequence `order_number_seq`                        |   |
|   |   - Database-level Idempotency Constraint (`orders.idempotency_key UNIQUE`)               |   |
|   |   - Narrowly Scoped Transaction Function (`create_guest_order`, SECURITY INVOKER)         |   |
|   +───────────────────────────────────────────────────────────────────────────────────────────+   |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Customer Data Model

The customer data model represents individual cracker buyers. In accordance with the approved business requirements, customers are unauthenticated guest buyers and have **no accounts, passwords, or customer logins**.

### 2.1 Approved Customer Fields

The customer record consists of exactly five (5) required business fields:

| Field | Type | Form Validation | Database Representation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | `min(2), max(100)` | `TEXT NOT NULL` | Full legal or contact name. |
| `mobile` | String | `^[6-9]\d{9}$` (10 digits) | `VARCHAR(15) NOT NULL UNIQUE` | Primary Indian mobile number (unique business identifier). |
| `address` | String | `min(5), max(500)` | `TEXT NOT NULL` | Physical delivery / street address. |
| `city` | String | `min(2), max(100)` | `TEXT NOT NULL` | Town, village, or city destination. |
| `pincode` | String | `^\d{6}$` (6 digits) | `VARCHAR(10) NOT NULL` | Indian Postal Pin Code. |

*Note on Schema Alignment:* While the historical Phase 3 database column definition permitted `NULL` for `city` and `pincode`, the **business and application data model strictly requires all 5 fields**. The checkout form and Server Action validation treat `city` and `pincode` as mandatory non-empty fields.

### 2.2 Explicit Exclusions from Customer Model
The following are **strictly prohibited**:
- ❌ No email field
- ❌ No password or credential fields
- ❌ No customer account or registration system
- ❌ No customer login or session management
- ❌ No customer roles or permissions
- ❌ No customer profile dashboard

---

## 3. Order Status Model

Order status tracks the physical fulfillment lifecycle of a cracker order. The approved order status model contains **exactly five (5) statuses**:

```
[ New ] ──────> [ Confirmed ] ──────> [ Processing ] ──────> [ Completed ]
   │                 │                      │
   └─────────────────┴──────────────────────┴───────────────────> [ Cancelled ]
```

### 3.1 Approved Status Definitions

| Status | Description | Permitted Actor |
| :--- | :--- | :--- |
| **`New`** | Initial status assigned automatically upon order creation. Customer has submitted cart. | System (Default) |
| **`Confirmed`** | Admin has reviewed order, verified product availability, and confirmed order with customer. | Admin |
| **`Processing`** | Order is being packed, boxes assembled, and prepared for dispatch in the warehouse. | Admin |
| **`Completed`** | Order has been fully handed over to customer / courier and fulfilled. | Admin |
| **`Cancelled`** | Order cancelled by Admin (e.g. out of stock, customer requested cancellation, non-responsive). | Admin |

### 3.2 Explicit Exclusions from Order Status Model
- ❌ **`Packed` is PROHIBITED** (Packing is captured under `Processing`).
- ❌ **`Delivered` is PROHIBITED** (Fulfillment is captured under `Completed`).
- ❌ **`Payment Status` is PROHIBITED** (No `Paid`, `Unpaid`, `Partially Paid`, `Refunded`).
- ❌ **`Shipping Status` is PROHIBITED** (No `Shipped`, `In Transit`, `Out for Delivery`).

---

## 4. Customer Read Flow (Catalog & Settings)

Public customers browse the store unauthenticated. The customer website reads public catalog and runtime configuration directly through the public Supabase client (`createBrowserClient` or server-side `createServerClient` using `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 4.1 Read Business Settings
- **Query:** `SELECT * FROM business_settings WHERE id = 1 LIMIT 1`
- **RLS Policy:** `business_settings_public_select` (`USING (id = 1)`).
- **Data Retrieved:** `business_name`, `business_logo_url`, `business_address`, `business_mobile`, `whatsapp_number`, `gpay_upi_number`, `gpay_qr_code_url`, `min_order_value`.
- **Consumers:** Header, Footer, Cart Minimum Order Validator, Checkout UPI Display, WhatsApp Dispatch Button.

### 4.2 Read Categories
- **Query:** `SELECT id, name FROM categories ORDER BY name ASC`
- **RLS Policy:** `categories_public_select` (`USING (true)`).
- **Data Retrieved:** Category UUIDs and display names.
- **Consumers:** Catalog Category Filter Tabs, Navigation Menu.

### 4.3 Read Available Products
- **Query:** `SELECT id, category_id, name, tamil_name, market_rate, selling_rate, stock, description, image_url FROM products WHERE is_available = true ORDER BY created_at ASC`
- **RLS Policy:** `products_public_select_available` (`USING (is_available = true)`).
- **Security Boundary:** Inactive products (`is_available = false`) are automatically filtered out at the database RLS level. Public clients cannot view or query inactive products.
- **Consumers:** Product Grid, Product Cards, Quick View Modal, Client-Side Cart.

---

## 5. Guest Checkout & Order Placement Flow

Guest order creation is the primary customer write path. It flows from the customer's browser through the Next.js Server Action to a trusted, atomic database operation.

### 5.1 End-to-End Execution Sequence

```
1. CUSTOMER BROWSER:
   - Selects cracker items & quantities in client cart (localStorage).
   - Mounts Checkout page; client generates an `idempotency_key` (UUID v4).
   - Enters customer details: name, mobile, address, city, pincode.
   - Clicks "Place Order".
                           │
                           │ Invokes Server Action: `submitGuestOrder(payload)`
                           v
2. NEXT.JS SERVER ACTION (TRUSTED NODE.JS RUNTIME):
   - Step A: Validates payload with Zod (`GuestOrderSchema`).
   - Step B: Server-Side Duplicate Product Normalization:
     * Groups submitted items by product UUID and sums quantities.
     * Asserts post-merge combined quantity does not exceed 1,000 units per product.
     * Produces normalized array of unique products (ensuring one order_item row per product).
   - Step C: Queries `products` table via Supabase client for unique product IDs:
     * Verifies all products exist.
     * Verifies all products have `is_available = true`.
     * Retrieves authoritative `products.name` and `products.selling_rate`.
   - Step D: Calculates trusted financial totals on the server:
     * Discards all client-submitted prices and totals.
     * `item_total = merged_quantity * db_selling_rate`
     * `total_quantity = sum(merged_quantity)`
     * `total_amount = sum(item_total)`
   - Step E: Queries `business_settings` (id = 1) for `min_order_value`:
     * Asserts `total_amount >= min_order_value`.
   - Step F: Prepares line items snapshot array (with verified names and rates).
                           │
                           │ Invokes Database Function via Service Role Client:
                           │ `supabaseServiceRole.rpc('create_guest_order', params)`
                           v
3. POSTGRESQL DATABASE (ATOMIC TRANSACTION):
   - Step G: Inspects `orders` for existing `idempotency_key`:
     * If matching key exists, immediately returns existing order details (Idempotent replay).
   - Step H: Resolves / Upserts `customers` by `mobile`:
     * If existing, updates `name`, `address`, `city`, `pincode`.
     * If new, inserts new customer record.
     * Obtains `customer_id`.
   - Step I: Inserts into `orders`:
     * Links `customer_id`.
     * Captures immutable customer snapshot (`customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`).
     * Records `total_quantity`, `total_amount`, and `idempotency_key`.
     * Sets `status = 'New'`.
     * Sequence generates `order_number` (`AMU-XXXXXX`).
   - Step J: Inserts all rows into `order_items`:
     * Links `order_id` and `product_id`.
     * Freezes `product_name`, `unit_price`, and `total_price`.
   - Step K: Commits transaction atomically.
                           │
                           │ Returns created/retrieved order record
                           v
4. NEXT.JS SERVER ACTION:
   - Fetches business contact metadata (WhatsApp number, GPay UPI number, QR URL).
   - Assembles sanitized safe customer response.
                           │
                           │ Returns `SafeOrderResult`
                           v
5. CUSTOMER BROWSER:
   - Clears client cart in localStorage.
   - Renders Order Confirmation Screen.
   - Provides pre-filled WhatsApp link (`wa.me/...`) for manual order dispatch.
```

---

## 6. Transaction Atomicity & Narrowly Scoped Database Function

### 6.1 Re-evaluation & Rejection of Sequential Writes + Compensating Deletion
The previous proposal (Option A: sequential PostgREST writes with a compensating `delete().eq('id', orderId)`) is **explicitly rejected**:
1. **Not ACID Equivalent:** PostgREST executes each HTTP call (`customers.upsert`, `orders.insert`, `order_items.insert`) as an isolated PostgreSQL transaction.
2. **Orphaned Order Risk:** If the server crashes, network drops, or execution times out between `orders.insert` and `order_items.insert`, an order header exists with a positive total amount and consumed order number, but with zero line items.
3. **Compensating Failure:** If the subsequent compensating `DELETE` itself fails (due to connection loss or container restart), the corrupted order permanently remains in the database.

### 6.2 Approved Narrowly Scoped Database Transaction Function
The architecture mandates a **single PostgreSQL database function** that executes the entire order write operation inside a single atomic transaction block:

```sql
-- Conceptual signature (implemented in migration 3, extended in Phase 10A lock)
CREATE OR REPLACE FUNCTION create_guest_order(
  p_idempotency_key UUID,
  p_customer_name TEXT,
  p_customer_mobile VARCHAR(15),
  p_customer_address TEXT,
  p_customer_city TEXT,
  p_customer_pincode VARCHAR(10),
  p_total_quantity INTEGER,
  p_total_amount NUMERIC(10, 2),
  p_items JSONB,
  p_notes TEXT DEFAULT NULL -- Added in Phase 10A architecture lock
) RETURNS JSONB;
```

### 6.3 Transactional Guarantees
Inside this function, PostgreSQL guarantees:
- **All-or-Nothing:** Either `customers` upsert, `orders` insert (including optional `notes`), and all `order_items` inserts are committed together, OR the entire transaction rolls back.
- **Zero Orphaned Orders:** Under no circumstances can an order header exist without its corresponding order items.
- **Sequence Protection:** If validation fails inside the transaction, the rollback prevents partial order state.
- **Order Notes Atomicity (Phase 10A Lock):** Optional customer order notes (`p_notes`) are persisted atomically into `orders.notes` during order insertion. If omitted, `NULL` is stored. The presence or absence of notes does NOT alter transaction atomicity or idempotency resolution. Retries carrying identical idempotency keys will return the existing order record without duplication.

---

## 7. Security Model for the Transactional Database Function

### 7.1 Security Mode Evaluation: `SECURITY INVOKER` vs `SECURITY DEFINER`
The function **MUST NOT** be created with `SECURITY DEFINER`.

The approved architecture uses **`SECURITY INVOKER`**:
- **Why `SECURITY INVOKER`?**
  - A `SECURITY INVOKER` function executes with the database privileges of the **calling role**.
  - When called from the Next.js Server Action, the Supabase client authenticates using `SUPABASE_SERVICE_ROLE_KEY`, connecting under the PostgreSQL `service_role`.
  - In Supabase, `service_role` has full write privileges on `customers`, `orders`, and `order_items`, and bypasses RLS.
  - Therefore, `SECURITY INVOKER` has complete access to perform the upsert and inserts when invoked by `service_role`.
  - It eliminates the risk of privilege escalation inherent in `SECURITY DEFINER`.

### 7.2 Strict Privilege Revocation & Grants
The database function must **never** be callable by public, anonymous, or authenticated browser clients:

```sql
-- Conceptual grant model (enforced in migration)
REVOKE ALL ON FUNCTION create_guest_order FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_guest_order FROM anon;
REVOKE EXECUTE ON FUNCTION create_guest_order FROM authenticated;

GRANT EXECUTE ON FUNCTION create_guest_order TO service_role;
```

### 7.3 Privilege Matrix

| Database Role | `EXECUTE` on Function | PostgREST HTTP RPC Access | Table RLS Write Access | Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **`anon` (Browser / Public)** | **REVOKED** | ❌ 403 Forbidden | ❌ Default-Deny | Cannot call function or write tables. |
| **`authenticated` (Admin JWT)** | **REVOKED** | ❌ 403 Forbidden | ✅ Admin RLS (Direct writes) | Uses Admin panel, not guest checkout RPC. |
| **`service_role` (Server-Side)** | **GRANTED** | ✅ Authorized | ✅ Bypasses RLS | Trusted Server Action executes transaction. |

### 7.4 Defense-in-Depth Guarantee
Even if PostgREST execution privileges were somehow misconfigured, `SECURITY INVOKER` ensures that an `anon` caller executes with `anon` permissions. Under Phase 4 RLS, `anon` has zero `INSERT` permissions on `customers`, `orders`, or `order_items`, causing immediate failure.

---

## 8. Database-Backed Idempotency-Key Architecture

### 8.1 Rejection of Time-Window Deduplication
The short-window deduplication heuristic (`customer_id + total_amount + 60 seconds`) is **explicitly rejected**:
- Two legitimate bulk orders placed by the same customer with the same total amount within a 1-minute window would be incorrectly merged.
- It relies on arbitrary heuristics rather than authoritative identity.

### 8.2 Database-Backed Unique Idempotency Key
The approved architecture enforces idempotency at the database engine level via a dedicated UUID column with a unique constraint:

```sql
-- Schema addition (to be applied in future migration)
orders.idempotency_key UUID NOT NULL UNIQUE
```

### 8.3 Conceptual Idempotency Lifecycle

```
[ Checkout Session Mounted ]
            │
            v
Generate `idempotency_key` (UUID v4) on client
            │
            v
Submit order with `idempotency_key`
            │
            v
Server Action validates payload
            │
            v
Transactional DB Function (`create_guest_order`)
            │
            v
Database checks `orders.idempotency_key`
            │
    +───────┴───────────────────────────────+
    │                                       │
[ First Submission ]             [ Retry with Same Key ]
    │                                       │
    v                                       v
Insert customer, order, items    Retrieve & return existing order
Generate order_number            (Zero duplicate records created)
Commit transaction               (Sequence gaps possible on conflict)
```

- **Different Genuine Orders:** A subsequent genuine order submission generates a brand new `idempotency_key`, resulting in a new order.
- **Client Submit Lock as UX Only:** Disabling the submit button (`disabled={isSubmitting}`) in the UI provides visual user feedback, but the **database unique constraint is the authoritative safeguard**.
- **PostgreSQL Sequence Non-Transactional Note:** Sequences in PostgreSQL do not roll back. If a concurrent duplicate attempt or failed transaction evaluates the sequence column default before aborting, that sequence value is consumed, leading to non-consecutive order numbers (gaps). This is normal and expected.

---

## 9. Concurrent Duplicate-Request Race Condition Analysis

### 9.1 The Race Condition Scenario
A customer double-clicks "Place Order" rapidly on a mobile device, or network retries fire two identical requests simultaneously:
- **Request A:** carries `idempotency_key = 'k1'`
- **Request B:** carries `idempotency_key = 'k1'`
- Both requests arrive at PostgreSQL concurrently (within milliseconds).

### 9.2 Database Engine Resolution Mechanism
The architecture relies entirely on PostgreSQL's engine-level concurrency control rather than JavaScript variables, memory caches, or timing windows:

```
Request A (T1)                                Request B (T2)
     │                                             │
BEGIN TRANSACTION                             BEGIN TRANSACTION
     │                                             │
Check `idempotency_key` (None found)         Check `idempotency_key` (None found)
     │                                             │
INSERT INTO orders (idempotency_key = 'k1')   INSERT INTO orders (idempotency_key = 'k1')
     │ (Acquires row lock on unique index)         │ (BLOCKED waiting on T1 lock)
INSERT INTO order_items                            │
     │                                             │
COMMIT TRANSACTION                                 │
     │                                             v
(T1 Succeeds: Order AMU-000001 created)       (T2 Unblocks: Unique Index Conflict!)
                                              Raises SQLSTATE '23505' (unique_violation)
                                                   │
                                                   v
                                              EXCEPTION WHEN unique_violation THEN:
                                              Query existing order WHERE key = 'k1'
                                              Return AMU-000001 details cleanly
```

### 9.3 Behavior Guarantees:
1. **Zero Duplicate Records:** Exactly one row exists in `orders`, and exactly one set of items exists in `order_items`.
2. **Identical Safe Response:** Both Request A and Request B receive a successful response referencing the identical `order_number` (`AMU-000001`).
3. **PostgreSQL Sequence Behavior (Non-Transactional):** Because column defaults evaluate `nextval('order_number_seq')` on insert before constraint conflict detection, concurrent duplicate collisions that trigger `unique_violation` consume a sequence value. The rolled-back insert leaves a sequence gap. Non-consecutive order numbers are acceptable and expected in PostgreSQL.

---

## 10. Service Role Boundary

The Supabase Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) is a superuser credential that bypasses RLS policies. It is an absolute architectural invariant that:

1. **Server-Only Isolation:** The Service Role key is loaded exclusively into server runtime memory (`process.env.SUPABASE_SERVICE_ROLE_KEY`).
2. **Never in Public Environment:** It must NEVER have the `NEXT_PUBLIC_` prefix.
3. **Never in Client Components:** It must NEVER be imported or bundled into client components, hooks, or pages.
4. **Never Exposed to Browser:** API responses and Server Action return values must NEVER serialize or return the key.
5. **No Direct Browser Database Writes:** The browser client communicates only with the Server Action; it has zero direct write access to sensitive database tables.

---

## 11. Admin Data Flows

Admin users authenticate through Supabase Auth (`authenticated` role) and perform administrative tasks via Server Actions or SSR Server Components.

### 11.1 Customer History Inspection
- **Relational Derivation:** Customer history is dynamically queried from `orders` and `order_items` joined on `customer_id`. There is no redundant history table.
- **Query Structure:**
  ```sql
  SELECT o.id, o.order_number, o.created_at, o.status, o.total_amount, o.total_quantity,
         oi.product_name, oi.quantity, oi.unit_price, oi.total_price
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.customer_id = :customerId
  ORDER BY o.created_at DESC;
  ```

### 11.2 Order Status Progression
- Admin advances `orders.status` strictly along the approved lifecycle:
  `New` ──> `Confirmed` ──> `Processing` ──> `Completed` (or `Cancelled`).
- Enforced by database `CHECK (status IN ('New', 'Confirmed', 'Processing', 'Completed', 'Cancelled'))`.

### 11.3 Admin Price Negotiation Flow
- When negotiating bulk discounts with a customer:
  1. Admin edits `order_items.unit_price` on specific line items (e.g. ₹8.50 instead of ₹10.00).
  2. Server updates `order_items.total_price = quantity * unit_price`.
  3. Server updates `orders.total_amount = sum(order_items.total_price)`.
  4. **Master Catalog Isolation:** The product master selling rate (`products.selling_rate`) in the catalog remains strictly untouched.

### 11.4 Catalog & Settings Management
- **Categories:** Full CRUD by Admin (`categories_admin_all` RLS policy).
- **Products:** Full CRUD by Admin (`products_admin_all` RLS policy). Soft-toggle availability via `is_available`.
- **Business Settings:** Single-row update (`business_settings_admin_update` RLS policy).

---

## 12. Trust Boundaries

```
[ UNTRUSTED ZONE: BROWSER / CLIENT ]
- Cart item selections (IDs, quantities)
- Customer delivery info (name, mobile, address, city, pincode)
- Client-generated idempotency key (UUID)
                 │
═════════════════╪═════════════════════════════════════════════════════
                 │ Server Action Network Boundary
                 v
[ TRUSTED APPLICATION ZONE: NEXT.JS SERVER ]
- Zod schema validation (types, formats, constraints)
- Trusted DB catalog lookup (`products.selling_rate`, `is_available`)
- Server-side price & total recomputation (discards client pricing)
- Enforcement of `min_order_value` threshold
- Private Supabase Service Role client (`SUPABASE_SERVICE_ROLE_KEY`)
                 │
═════════════════╪═════════════════════════════════════════════════════
                 │ RPC Execution Boundary (`create_guest_order`)
                 v
[ SECURE DATABASE ZONE: POSTGRESQL ]
- Execution as `service_role` via `SECURITY INVOKER`
- Atomic multi-table write (customers, orders, order_items)
- Unique constraint enforcement (`orders.idempotency_key UNIQUE`)
- Sequence generation (`order_number_seq`)
- Foreign key and check constraint integrity
```

---

## 13. Validation Rules

All checkout payloads must pass strict Zod validation before reaching the database:

```typescript
import { z } from 'zod';

export const GuestOrderSchema = z.object({
  idempotencyKey: z.string().uuid("Invalid idempotency key format"),
  customer: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
    address: z.string().trim().min(5, "Address must be at least 5 characters").max(500, "Address too long"),
    city: z.string().trim().min(2, "City must be at least 2 characters").max(100, "City too long"),
    pincode: z.string().trim().regex(/^\d{6}$/, "Must be a valid 6-digit Indian PIN code"),
  }),
  items: z.array(z.object({
    productId: z.string().uuid("Invalid product identifier"),
    quantity: z.number().int().positive("Quantity must be greater than zero").max(1000, "Maximum 1,000 units per item"),
  })).min(1, "Order must contain at least one item"),
});

export type GuestOrderInput = z.infer<typeof GuestOrderSchema>;
```

### 13.1 Server-Side Duplicate Product Normalization
Duplicate product IDs submitted within a single checkout payload are merged server-side by summing their quantities before price calculation and order-item creation. The final order contains one order item per unique product.

- **Normalization Workflow:**
  1. Group submitted items by `productId`.
  2. Sum requested quantities for identical product UUIDs.
  3. Validate post-merge combined quantity: must not exceed 1,000 units per unique product (reject with `VALIDATION_ERROR` if exceeded; do not silently cap or reduce).
  4. Calculate trusted prices and line totals using the merged quantities and database `selling_rate`.
  5. Pass merged items to the database transaction, guaranteeing at most one `order_item` row per product.

---

## 14. Error Handling & Sanitization

All server-side errors are caught and sanitized before being returned to the customer client:

| Internal Scenario | Error Code | Safe Customer-Facing Message | HTTP / Action Status |
| :--- | :--- | :--- | :--- |
| Validation failure (phone, pincode, etc.) | `VALIDATION_ERROR` | "Please review your contact details and try again." | 400 Bad Request |
| Empty cart or invalid quantities | `INVALID_ITEMS` | "Your order must contain at least one valid item." | 400 Bad Request |
| Product ID not found in catalog | `PRODUCT_NOT_FOUND` | "One or more items in your cart are no longer available." | 400 Bad Request |
| Product is inactive (`is_available = false`) | `PRODUCT_UNAVAILABLE` | "Item '{name}' is currently unavailable." | 400 Bad Request |
| Total amount $<$ `min_order_value` | `MIN_ORDER_NOT_MET` | "Minimum order value is ₹{min}. Current total is ₹{total}." | 400 Bad Request |
| Concurrency or database failure | `ORDER_FAILED` | "Unable to place order at this time. Please try again." | 500 Internal Error |

---

## 15. Safe Customer Post-Order Response Model

Upon successful order placement, the Server Action returns strictly the minimum sanitized dataset required for customer confirmation:

```typescript
export type SafeOrderResult = {
  success: true;
  order: {
    id: string; // Order UUID
    orderNumber: string; // e.g. "AMU-000001"
    createdAt: string; // ISO 8601
    status: "New";
    customer: {
      name: string;
      phone: string;
      address: string;
      city: string;
      pincode: string;
    };
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    totalQuantity: number;
    totalAmount: number;
  };
  business: {
    whatsappNumber: string;
    gpayUpiNumber: string;
    gpayQrCodeUrl: string | null;
  };
};
```

---

## 16. Explicitly Excluded Functionality

The following systems are **strictly excluded** from the application architecture:
1. ❌ **No Payment Gateway / Processing:** No Razorpay, Stripe, webhook listeners, or payment ledger tables.
2. ❌ **No Payment Status:** Orders do not track payment state; GPay/UPI is business contact information only.
3. ❌ **No Shipping / Logistics System:** No courier integrations, live tracking APIs, shipping cost calculators, or delivery status.
4. ❌ **No Discount / Coupon Code Engine:** No promo codes, percentage vouchers, or discount rules. Price negotiation is handled manually by Admin on `order_items`.
5. ❌ **No Cart Database Persistence:** Cart state lives purely in the customer's browser (localStorage).
6. ❌ **No Wishlist System:** No wishlist tables or user preference tracking.
7. ❌ **No Customer Accounts / Authentication:** Customers have no passwords, profiles, logins, or dashboard.
8. ❌ **No Automated WhatsApp Bot:** WhatsApp integration is purely a client-side link dispatch (`https://wa.me/...`).

---

## 17. Migration Plan & Database Integrity

### 17.1 Existing Migrations are Locked
The existing migrations remain completely **untouched**:
- `supabase/migrations/20261001000000_initial_database_schema.sql` (LOCKED)
- `supabase/migrations/20261001000001_enable_rls_and_auth_policies.sql` (LOCKED)
- `supabase/migrations/20261001000002_create_storage_infrastructure.sql` (LOCKED)

### 17.2 Future Migration for Phase 6B
When implementation commences in Phase 6B, a **new migration file** (e.g., `20261001000003_add_order_idempotency_and_transaction_fn.sql`) will be created containing:
1. Addition of `idempotency_key UUID NOT NULL UNIQUE` column to `orders`.
2. Definition of `create_guest_order(...)` with `SECURITY INVOKER`.
3. Revocation of execution from `PUBLIC`, `anon`, and `authenticated`.
4. Grant of execution to `service_role`.

---

## 18. Architectural Decisions Summary & Resolution Status

All architectural questions flagged in Phase 6A are now **fully resolved**:

| Decision Topic | Previous Proposal | Resolved Architectural Decision | Rationale |
| :--- | :--- | :--- | :--- |
| **Transaction Atomicity** | Sequential writes + compensating DELETE | **Narrowly scoped PostgreSQL transaction function (`create_guest_order`)** | Guarantees true ACID all-or-nothing atomicity. Eliminates orphaned orders. |
| **Function Security Mode** | Undecided / Ambiguous | **`SECURITY INVOKER` with `GRANT EXECUTE TO service_role` ONLY** | Eliminates privilege escalation; PostgREST enforces role boundaries; defense-in-depth. |
| **Idempotency Strategy** | 60-second time-window deduplication | **Database-backed `idempotency_key UUID UNIQUE` on `orders` table** | Authoritative database constraint; prevents duplicate orders on retries; handles concurrent races. |
| **Order Status Model** | Incorrectly included `Packed` & `Delivered` | **Strict 5-status lifecycle: `New`, `Confirmed`, `Processing`, `Completed`, `Cancelled`** | Exactly aligns with locked database schema and business fulfillment model. |
| **Customer Data Model** | City/pincode marked optional | **5 mandatory fields: `name`, `mobile`, `address`, `city`, `pincode`** | Restores approved business data model; validated strictly in Server Action. |
| **Duplicate Product IDs** | Separate line items (ambiguous) | **LOCKED: Server-side merge by product UUID** | Sums quantities server-side; validates max 1,000 units post-merge; guarantees 1 order item per product. |
| **Sequence Consumption** | "Zero sequence numbers burned" (incorrect) | **CORRECTED: Non-transactional sequence gaps** | Sequences do not roll back; concurrent collisions consume sequence values, resulting in gaps. |
