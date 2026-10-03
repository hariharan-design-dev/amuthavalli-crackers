# Database Architecture & Schema Design (Final Specification)

**Project:** Amuthavalli Crackers  
**Phase:** Phase 2 — Database Architecture & Schema Design  
**Status:** FINAL LOCKED ARCHITECTURE (Ready for Phase 3 Implementation)  
**Target Database:** PostgreSQL (Supabase)

---

## 1. Purpose & Scope

This document establishes the **final, locked database architecture and schema design** for the **Amuthavalli Crackers** web application. 

It defines all relational entities, attributes, primary/foreign key relationships, constraint rules, data lifecycles, and data flow boundaries across the system. 

This phase is **architecture and design only**. No physical tables, migrations, RLS policies, storage buckets, or application code are created during this phase.

---

## 2. Core Architecture Principles

1. **PostgreSQL as Single Source of Truth:** PostgreSQL hosted on Supabase is the sole dynamic authority for all application data: product catalog, categories, customer registry, orders, line items, and dynamic business configuration.
2. **Strict Pricing Decoupling:** Order item purchase prices are completely decoupled from product master selling prices. When Admin negotiates pricing on an order, the agreed price is saved strictly on the order line item. Product master selling rates remain untouched.
3. **Current vs. Historical Customer Data Separation:** 
   - The `customers` table stores the customer's *current* profile.
   - The `orders` table preserves an *immutable historical snapshot* of customer contact details (`customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`) as they existed at the moment the order was placed. Future updates to the customer record do not mutate historical orders.
4. **No Customer Authentication:** Customers do not have accounts, passwords, sessions, or credentials in Supabase Auth. Customers place orders as direct guests during checkout.
5. **Mobile Number as Customer Business Identifier:** The customer's mobile number is the unique business identifier in the `customers` registry. Repeat orders with the same mobile number resolve to the same customer entity without creating duplicate customer records.
6. **Human-Readable Order Reference:** Every order is assigned a sequential, human-readable identifier (e.g., `AMU-000001`, `AMU-000002`) generated automatically via a PostgreSQL native sequence column `DEFAULT`, distinct from its technical UUID database primary key.
7. **Soft Product Deactivation:** Products linked to past orders are never hard-deleted. They are deactivated via `is_available = false`, which excludes them from customer browsing while preserving historical referential integrity.
8. **Zero E-Commerce Bloat:** The database contains no shopping cart tables, wishlist tables, coupon/discount engines, payment gateway ledgers, transaction records, shipping calculations, courier tracking, or generic CMS tables.
9. **WhatsApp as an External Communication Channel:** WhatsApp is used exclusively for customer-to-admin message dispatch via dynamic pre-filled links. WhatsApp is not an order repository; Supabase is the permanent data store.
10. **Invoice as a Derived Document:** Invoices are dynamically generated visual documents rendered directly from order and order-item records. No separate invoice database table exists.
11. **Privileged Server-Side Guest Checkout (Next.js Server Action + Supabase Service Role):** Public customers are completely unauthenticated guests. Guest checkout submissions are handled exclusively server-side via a Next.js Server Action executing with the Supabase Service Role key (strictly server-only). Anonymous clients have zero direct table-level write or read access to `customers`, `orders`, and `order_items` (enforced via RLS default-deny). The Server Action performs server-side input validation, verifies selling rates against trusted database catalog rates, resolves/upserts customer records, creates orders with database-assigned sequential order numbers (`order_number_seq`), creates line items, and returns only a safe order confirmation reference. The Service Role key remains strictly server-side and is never exposed to browser code. No PostgreSQL `SECURITY DEFINER` RPC is used.

```
+---------------------------------------------------------------------------------------------------+
|                                          APPLICATION TIER                                         |
|                                                                                                   |
|   +------------------------------------+               +--------------------------------------+   |
|   |          CUSTOMER WEBSITE          |               |             ADMIN PANEL              |   |
|   |  - Product browsing (categories)   |               |  - Product & Category management     |   |
|   |  - In-memory/browser Cart state    |               |  - Pricing negotiation               |   |
|   |  - Checkout submission             |               |  - Order lifecycle management        |   |
|   |  - WhatsApp inquiry dispatch       |               |  - Customer order history            |   |
|   |  - Optional UPI payment facility   |               |  - Business settings & assets        |   |
|   +-----------------+------------------+               +------------------+-------------------+   |
|                     │                                                     │                       |
|                     v (Checkout Form Submit)                              │                       |
|   +------------------------------------+                                  │                       |
|   |       NEXT.JS SERVER ACTION        |                                  │                       |
|   |  (Server-Side Execution Context)   |                                  │                       |
|   |  - Validate payload & min order    |                                  │                       |
|   |  - Query trusted selling rates     |                                  │                       |
|   |  - Resolve customer by mobile      |                                  │                       |
|   |  - Atomic order & items creation   |                                  │                       |
|   +-----------------+------------------+                                  │                       |
+---------------------|-----------------------------------------------------|-----------------------+
                      │ (Server Action via Service Role Key)                │ (Supabase Auth Admin)
                      │ [Upsert Customers, Insert Orders & Items]           │ [Full CRUD Master Data]
                      │                                                     │ [Update Prices & Status]
                      │ (Public Anon Client)                                │
                      │ [Read Active Catalog & Settings Only]               │
                      v                                                     v
+---------------------------------------------------------------------------------------------------+
|                                     SUPABASE BACKEND SERVICES                                     |
|                                                                                                   |
|  +---------------------------------------------+   +-------------------------------------------+  |
|  |                 POSTGRESQL                  |   |              STORAGE BUCKETS              |  |
|  |             (Relational Data)               |   |               (Binary Media)              |  |
|  |                                             |   |                                           |  |
|  |  [categories] ──< [products]                |   |  - Product images (`products`)            |  |
|  |                       │                     |   |  - Business logo (`business`)             |  |
|  |  [customers]  ──< [orders]                  |   |  - GPay / UPI QR code (`business`)        |  |
|  |                       │                     |   |                                           |  |
|  |                   [order_items]             |   |                                           |  |
|  |  [business_settings]                        |   |                                           |  |
|  +---------------------------------------------+   +-------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Final Entity List

The database architecture consists of **six (6) primary relational entities**:

1. **`categories`**: Master classifications for organizing crackers in the catalog and Admin panel.
2. **`products`**: Master catalog of cracker items with selling rates, stock indicators, and availability flags.
3. **`customers`**: Master customer registry indexed by unique mobile number, storing current customer contact details.
4. **`orders`**: Order headers storing human-readable order numbers, customer references, immutable historical customer snapshots, order totals, and fulfillment status.
5. **`order_items`**: Line items recording specific products purchased, quantities, and negotiated unit prices for an order.
6. **`business_settings`**: Singleton configuration table storing dynamic business identity, contact numbers, payment details, and operational thresholds.

---

## 4. Entity Definitions & Field Dictionaries

### 4.1 `categories`
Defines hierarchical classification groups for products (e.g., "Sparklers", "Chakkars", "Flower Pots", "Rockets", "Sound Crackers", "Gift Boxes").

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key, `DEFAULT gen_random_uuid()` | Internal technical identifier. |
| `name` | TEXT | No | `NOT NULL`, `UNIQUE` | Display name of the category in English. |
| `created_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when category was created. |
| `updated_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when category was last modified. |

---

### 4.2 `products`
Master catalog of crackers available for purchase.

*LOCKED ARCHITECTURE NOTE:* There is **NO separate product code or SKU field** (`sku`, `product_code`, `item_code`, `business_code`). The serial/position number from Excel is not a permanent product code; the database primary key (`id`) is the sole product identity.

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key, `DEFAULT gen_random_uuid()` | Internal technical primary key. |
| `category_id` | UUID | No | `NOT NULL`, `REFERENCES categories(id) ON DELETE RESTRICT` | Foreign key to owning category. |
| `name` | TEXT | No | `NOT NULL` | Product name in English (mandatory). |
| `tamil_name` | TEXT | Yes | Nullable | Product name in Tamil for regional display (optional). |
| `market_rate` | NUMERIC(10, 2) | Yes | Nullable, `CHECK (market_rate >= 0)` | Reference market rate to show customer savings (optional). |
| `selling_rate` | NUMERIC(10, 2) | No | `NOT NULL`, `CHECK (selling_rate > 0)` | Our selling rate; standard customer price (mandatory). |
| `stock` | INTEGER | Yes | Nullable, `CHECK (stock >= 0)` | Current inventory count, if tracked (optional). |
| `low_stock_threshold` | INTEGER | Yes | Nullable, `CHECK (low_stock_threshold >= 0)` | Alert threshold for low inventory (optional). |
| `description` | TEXT | Yes | Nullable | Product description, piece count, or specs (optional). |
| `image_url` | TEXT | Yes | Nullable | Public URL of single product image in Storage (optional). |
| `is_available` | BOOLEAN | No | `NOT NULL`, `DEFAULT true` | Master availability toggle (mandatory). If false, hidden from customers. |
| `created_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when product was created. |
| `updated_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when product was last modified. |

---

### 4.3 `customers`
Master customer registry.

*LOCKED ARCHITECTURE NOTE:* Customers are a **dedicated entity**, not embedded solely inside orders. Customers do **NOT** have passwords, accounts, or Supabase Auth credentials. Mobile number is the **unique business identifier**.

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key, `DEFAULT gen_random_uuid()` | Internal technical primary key. |
| `name` | TEXT | No | `NOT NULL` | Current full name of the customer. |
| `mobile` | VARCHAR(15) | No | `NOT NULL`, `UNIQUE` | Unique mobile phone number (business identifier). |
| `address` | TEXT | No | `NOT NULL` | Current primary delivery address. |
| `city` | TEXT | Yes | Nullable | Current city / town destination. |
| `pincode` | VARCHAR(10) | Yes | Nullable | Current postal area code. |
| `created_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when customer was first registered. |
| `updated_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp when customer profile was last updated. |

---

### 4.4 `orders`
Order headers recording placement transactions, customer references, and fulfillment status.

*LOCKED ARCHITECTURE NOTE:* `orders` contains **both** a foreign key to `customers` (`customer_id`) and an **immutable historical customer snapshot** (`customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`) captured at the exact moment of order placement.

*LOCKED ARCHITECTURE NOTE (Phase 6):* `orders.idempotency_key UUID NOT NULL UNIQUE` provides strict database-backed duplicate submission protection for checkout retries and network interruptions.

*LOCKED ARCHITECTURE NOTE (Phase 10A):* `orders.notes TEXT NULL` stores the optional customer-provided order instructions. It is captured at checkout and preserved in historical order records for Admin review. If no note is provided by the customer, it stores `NULL`. It is strictly plain text, validated server-side to a maximum of 1,000 characters.

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key, `DEFAULT gen_random_uuid()` | Technical database primary key. |
| `idempotency_key` | UUID | No | `NOT NULL`, `UNIQUE` | Unique client-generated submission key ensuring idempotent guest checkouts. |
| `order_number` | VARCHAR(20) | No | `NOT NULL`, `UNIQUE`, `DEFAULT ('AMU-' || LPAD(nextval('order_number_seq')::text, 6, '0'))` | Sequential human-readable identifier (e.g., `AMU-000001`), automatically generated via PostgreSQL native sequence `order_number_seq`. |
| `customer_id` | UUID | No | `NOT NULL`, `REFERENCES customers(id) ON DELETE RESTRICT` | Link to customer master record. |
| `customer_name` | TEXT | No | `NOT NULL` | Historical snapshot of customer name at order time. |
| `customer_phone` | TEXT | No | `NOT NULL` | Historical snapshot of customer phone at order time. |
| `customer_address` | TEXT | No | `NOT NULL` | Historical snapshot of delivery address at order time. |
| `customer_city` | TEXT | Yes | Nullable | Historical snapshot of delivery city at order time. |
| `customer_pincode` | VARCHAR(10) | Yes | Nullable | Historical snapshot of postal code at order time. |
| `status` | TEXT | No | `NOT NULL`, `CHECK (status IN ('New', 'Confirmed', 'Processing', 'Completed', 'Cancelled'))`, `DEFAULT 'New'` | Strict approved order lifecycle status. |
| `total_quantity` | INTEGER | No | `NOT NULL`, `CHECK (total_quantity > 0)` | Aggregate count of all boxes/items ordered. |
| `total_amount` | NUMERIC(10, 2) | No | `NOT NULL`, `CHECK (total_amount >= 0)` | Total order value (recalculated on negotiation). |
| `notes` | TEXT | Yes | Nullable, `DEFAULT NULL` | Optional customer-provided order instructions / notes (max 1000 plain text characters). |
| `created_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Order creation timestamp. |
| `updated_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Order modification timestamp. |

---

### 4.5 `order_items`
Individual line items representing specific crackers purchased in an order.

*LOCKED ARCHITECTURE NOTE:* Preserves purchase-specific and negotiated unit pricing. The `unit_price` is initialized from `products.selling_rate` at checkout, but can be updated by Admin during price negotiation without altering the product master selling rate.

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | Primary Key, `DEFAULT gen_random_uuid()` | Internal technical primary key. |
| `order_id` | UUID | No | `NOT NULL`, `REFERENCES orders(id) ON DELETE CASCADE` | Owning order reference. Cascades on order deletion. |
| `product_id` | UUID | No | `NOT NULL`, `REFERENCES products(id) ON DELETE RESTRICT` | Reference to original product master record. |
| `product_name` | TEXT | No | `NOT NULL` | Historical snapshot of product name at purchase time. |
| `quantity` | INTEGER | No | `NOT NULL`, `CHECK (quantity > 0)` | Number of units/boxes ordered. |
| `unit_price` | NUMERIC(10, 2) | No | `NOT NULL`, `CHECK (unit_price >= 0)` | Purchase/negotiated price per unit. Admin editable. |
| `total_price` | NUMERIC(10, 2) | No | `NOT NULL`, `CHECK (total_price >= 0)` | Line total (`quantity * unit_price`). Recalculated. |
| `created_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Line item creation timestamp. |

---

### 4.6 `business_settings`
Singleton runtime configuration table for dynamic business metadata.

| Field | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER | No | Primary Key, `CHECK (id = 1)` | Singleton enforcement: exactly one record exists. |
| `business_name` | TEXT | No | `NOT NULL` | Trade business name ("Amuthavalli Crackers"). |
| `business_logo_url` | TEXT | Yes | Nullable | Public URL of brand logo in Storage. |
| `business_address` | TEXT | No | `NOT NULL` | Physical premises / depot dispatch address. |
| `business_mobile` | TEXT | No | `NOT NULL` | Primary customer care telephone number. |
| `whatsapp_number` | TEXT | No | `NOT NULL` | Dynamic WhatsApp target number for order dispatch. |
| `gpay_upi_number` | TEXT | No | `NOT NULL` | UPI VPA / mobile number displayed for payment. |
| `gpay_qr_code_url` | TEXT | Yes | Nullable | Public URL of GPay QR code graphic in Storage. |
| `min_order_value` | NUMERIC(10, 2) | No | `NOT NULL`, `DEFAULT 0.00`, `CHECK (min_order_value >= 0)` | Minimum cart subtotal required to submit an order. |
| `updated_at` | TIMESTAMPTZ | No | `NOT NULL`, `DEFAULT now()` | Timestamp of last settings update. |

---

## 5. Relationships & Cardinality

```
+------------------+
|    categories    |
+--------+---------+
         |
         | 1 : N (One category has many products)
         v
+------------------+                    +------------------+
|     products     |                    |    customers     |
+--------+---------+                    +--------+---------+
         |                                       |
         |                                       | 1 : N (One customer has many orders)
         |                                       v
         |                              +------------------+
         |                              |      orders      |
         |                              +--------+---------+
         |                                       |
         | 1 : N                                 | 1 : N (One order has many line items)
         | (Referential master)                  |
         |                                       |
         +------------------>+<------------------+
                             |
                     +-------+--------+
                     |  order_items   |
                     +----------------+

+-----------------------+
|   business_settings   |  (Isolated Singleton Entity: id = 1)
+-----------------------+
```

### Relational Integrity Rules:
1. **`categories` (1) ──< (0..N) `products`:**
   - Every product references exactly one category (`products.category_id` -> `categories.id`).
   - A category cannot be deleted if products are associated with it (`ON DELETE RESTRICT`).
2. **`customers` (1) ──< (0..N) `orders`:**
   - Every order references exactly one customer (`orders.customer_id` -> `customers.id`).
   - A customer with existing orders cannot be deleted (`ON DELETE RESTRICT`), guaranteeing customer order history preservation.
3. **`orders` (1) ──< (1..N) `order_items`:**
   - An order consists of one or more line items (`order_items.order_id` -> `orders.id`).
   - If an order is deleted (e.g. database cleanup), its line items are deleted in cascade (`ON DELETE CASCADE`).
4. **`products` (1) ──< (0..N) `order_items`:**
   - Each order item points to the original product (`order_items.product_id` -> `products.id`).
   - A product referenced by existing orders cannot be hard-deleted (`ON DELETE RESTRICT`). Deactivation is performed via `is_available = false`.
5. **`business_settings` (Singleton):**
   - Independent configuration entity. No foreign keys to operational tables.

---

## 6. Customer Architecture & Lifecycle

### 6.1 Guest Checkout & Customer Identification
- Customers do not log in and have no account credentials.
- In the checkout form, the customer provides: `name`, `mobile`, `address`, `city` (optional), `pincode` (optional).
- The **mobile number** is the unique business identifier for customers.

### 6.2 Order Placement Customer Resolution Logic
The checkout customer resolution logic executes **strictly server-side within the Next.js Server Action** utilizing the privileged Supabase Service Role key. Public anonymous clients have zero direct `SELECT`, `INSERT`, or `UPDATE` access to the `customers` table (enforced via RLS default-deny), protecting all customer PII and preventing contact profile tampering.

When an order is submitted through the public checkout form:
```
                               Customer submits Checkout Form
                                              │
                                              v
                              Lookup `customers` by `mobile`
                                              │
                       +----------------------+----------------------+
                       │                                             │
             [Mobile DOES NOT exist]                         [Mobile EXISTS]
                       │                                             │
                       v                                             v
          Insert new row in `customers`                  Update `customers` profile:
          (name, mobile, address, city, pincode)         (sync current name, address, etc.)
                       │                                             │
                       +──────────────────────┬──────────────────────+
                                              │
                                              v
                                   Obtain `customer.id`
                                              │
                                              v
                                Create row in `orders`
            (Link `customer_id` + save historical customer snapshot fields)
```

1. **Server-Side Execution Context:** The resolution logic runs entirely on the server within the Next.js Server Action using the Supabase Service Role key. The public browser receives zero direct database permissions.
2. **New Customer:** If the mobile number does not exist, a new record is inserted into `customers`.
3. **Returning Customer:** If the mobile number exists, the existing customer record is resolved. Its current details (`name`, `address`, `city`, `pincode`) are updated to reflect the latest contact information.
4. **Zero Duplication:** No duplicate customer records are ever created for the same mobile number (`mobile` is unique).
5. **No Customer Authentication:** Resolving customers by mobile number does not create or require a Supabase Auth user or customer session. Customers remain completely unauthenticated guests.

---

## 7. Historical Snapshot Rules (Dual Isolation)

To guarantee that historical financial and fulfillment records remain immutable regardless of future master data updates, the architecture enforces **dual snapshotting**:

```
+─────────────────────────────────────────+─────────────────────────────────────────+
|               MASTER DATA               |         HISTORICAL ORDER DATA           |
|            (Mutable / Live)             |          (Immutable Snapshot)           |
+─────────────────────────────────────────+─────────────────────────────────────────+
|                                         |                                         |
|  `customers`                            |  `orders`                               |
|  - mobile: 9876543210                   |  - customer_id: [ref to customer]       |
|  - address: "Flat 4B, Chennai" (Current)|  - customer_phone: 9876543210           |
|                                         |  - customer_address: "Flat 2A, Madurai" |
|                                         |    (Preserved from order placement date)|
|                                         |                                         |
|  `products`                             |  `order_items`                          |
|  - name: "28 Chakkars Special"          |  - product_id: [ref to product]         |
|  - selling_rate: ₹120.00 (Current)      |  - product_name: "28 Chakkars Special"  |
|                                         |  - unit_price: ₹100.00                  |
|                                         |    (Preserved purchase/negotiated price)|
+─────────────────────────────────────────+─────────────────────────────────────────+
```

### 1. Customer Information Snapshot on `orders`:
- Even though `orders.customer_id` links to `customers.id`, the order stores:
  `customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`.
- If the customer later moves to a new city and places a subsequent order, their profile in `customers` reflects the new city, but all past orders retain the historical delivery address from when those orders were fulfilled.
- Historical invoices and order documents never depend on joining current customer data.

### 2. Product Name and Pricing Snapshot on `order_items`:
- `order_items` stores `product_name` and `unit_price`.
- If the master product name or selling rate in `products` is updated later, existing order items retain the exact product name and price agreed upon at the time of purchase or negotiation.

---

## 8. Pricing & Negotiation Rules

### 8.1 Product Master Selling Rate
- `products.selling_rate` is the normal, customer-facing retail price displayed on the catalog.
- Customer-side cart and initial order calculations strictly multiply item quantities by `products.selling_rate`.

### 8.2 Order Item Purchase Pricing & Admin Negotiation
- When an order is created, `order_items.unit_price` is initialized to `products.selling_rate`.
- In the seasonal crackers business, customers frequently contact Admin to request bulk order discounts.
- Admin opens the order in the Admin Panel and directly modifies `order_items.unit_price` for specific items (e.g., reducing unit price from ₹10.00 to ₹8.50).
- The system recalculates `order_items.total_price = quantity * unit_price` and updates `orders.total_amount = sum(order_items.total_price)`.
- **Master Price Isolation:** The master product selling rate in `products.selling_rate` remains strictly unchanged (₹10.00).

### 8.3 Absolute Prohibition of Discount Systems
- There is **NO** discount system, discount table, discount code, coupon system, promotional rule engine, or discount status column.
- All price adjustments and negotiations exist exclusively as the direct, explicit `unit_price` recorded on each individual `order_items` record.

---

## 9. Category Normalization & Excel Import Rules

### 9.1 Category Matching Normalization Algorithm
During Excel price-list import and catalog validation, category matching must prevent duplicate categories resulting from trivial formatting variations.

The normalization algorithm performs:
1. **Case Normalization:** Conversion of all characters to lowercase.
2. **Whitespace Trimming:** Stripping leading and trailing whitespace.
3. **Internal Whitespace Collapsing:** Replacing repeated spaces, tabs, or newlines with a single space.
4. **Basic Concatenation / Spacing Equivalence:** Stripping non-alphanumeric punctuation and matching collapsed character sequences.

#### Test Candidates Treated as Equivalent Logical Category:
- `"Single Piece"`
- `"single piece"`
- `"SINGLE PIECE"`
- `"Single  Piece"`
- `"SinglePiece"`

### 9.2 Critical Preservation Rule:
- **Normalization is strictly for matching and validation.**
- The system **must NOT** overwrite or rename the human-readable category name in the database.
- The canonical display category name remains the Admin-approved name stored in `categories.name`.

### 9.3 Unmatched Category Handling:
- If an Excel row contains a category that does not match any existing normalized category in the database:
  1. The import engine **must flag it as an unresolved category during validation**.
  2. The import engine **must NOT silently create a new category**.
  3. The system requires explicit Admin confirmation to either map it to an existing category or consciously create a new category.

---

## 10. Product Ordering Rules

1. **Initial Product Ordering:** Follows the physical order/sequence supplied in the imported Excel price list.
2. **Excel Serial Number Purpose:** The serial number in the Excel sheet is **not** a product code, SKU, or permanent identifier. It is strictly an ordering index and physical price-list position reference.
3. **Future Reordering:** Manual reordering of products within categories by Admin may be supported in future phases. No over-engineered sequence arrays or complex ranking models are introduced at this stage.

---

## 11. Human-Readable Order Number Specification

Every order possesses a unique, human-readable reference number distinct from its technical UUID primary key:

### 11.1 WHAT: Human-Facing Order Number Format
- **Format:** `AMU-000001`, `AMU-000002`, `AMU-000003`, ..., `AMU-999999`
- **Prefix:** `AMU-` (Amuthavalli Crackers)
- **Sequence Number:** 6-digit zero-padded sequential integer.
- **Uniqueness:** Database-enforced uniqueness via `UNIQUE` constraint on `orders.order_number`.
- **Purpose:** Used in customer-facing communication, WhatsApp order dispatch messages, invoice headers, and Admin dashboard search.
- **Key Separation:** The technical primary key remains an internal UUID (`orders.id`). `order_number` is the external, human-facing identifier.

### 11.2 HOW: PostgreSQL Native Sequence-Backed Column DEFAULT
The approved generation mechanism is database-controlled, monotonic, and atomic:
1. **PostgreSQL Native Sequence:** `CREATE SEQUENCE order_number_seq START WITH 1 INCREMENT BY 1;`
2. **Column DEFAULT Expression:**
   ```sql
   DEFAULT ('AMU-' || LPAD(nextval('order_number_seq')::text, 6, '0'))
   ```
3. **Column Definition:** `order_number VARCHAR(20) NOT NULL UNIQUE DEFAULT ('AMU-' || LPAD(nextval('order_number_seq')::text, 6, '0'))`
4. **Database-Controlled & Atomic:** Order-number generation is strictly database-controlled and atomic. It guarantees unique monotonic sequence assignment and eliminates race conditions during concurrent customer checkouts. Note: Because PostgreSQL sequences are non-transactional, sequence gaps may occur during failed, conflicting, or rolled-back transactions.
5. **Application Boundary:** Application code **must NOT** calculate, guess, or assign the next order number. PostgreSQL automatically assigns the formatted order number on row insertion.

---

## 12. Order Status Lifecycle

The system supports **strictly five (5) approved order statuses**:

```
                 +─────────────────────────────────────────+
                 │                   New                   │ (Customer placed order)
                 +────────────────────┬────────────────────+
                                      │
                                      v
                 +─────────────────────────────────────────+
                 │                Confirmed                │ (Admin verified order/payment)
                 +────────────────────┬────────────────────+
                                      │
                                      v
                 +─────────────────────────────────────────+
                 │               Processing                │ (Admin packing crackers at depot)
                 +────────────────────┬────────────────────+
                                      │
                                      v
                 +─────────────────────────────────────────+
                 │                Completed                │ (Order dispatched / handed over)
                 +─────────────────────────────────────────+

  (From 'New', 'Confirmed', or 'Processing') ──────────────> [ Cancelled ]
```

### Approved Status Definitions:
1. **`New`:** Default status when an order is placed by the customer through checkout.
2. **`Confirmed`:** Admin has reviewed the order, discussed pricing/shipping with customer, and confirmed validity.
3. **`Processing`:** Crackers are being assembled, packed, and boxed at the warehouse/depot.
4. **`Completed`:** Order has been dispatched via parcel service or handed over to the customer.
5. **`Cancelled`:** Order was cancelled by Admin due to out-of-stock items, non-payment, or customer cancellation.

### Explicitly Prohibited Statuses:
The following statuses are **strictly forbidden** and must not exist in schema check constraints or code:
❌ `Awaiting Payment`, ❌ `Payment Pending`, ❌ `Pending`, ❌ `Shipped`, ❌ `Delivered`, ❌ `Refunded`, ❌ `Failed`, ❌ `Rejected`.

---

## 13. Payment Boundaries (Optional UPI Facility)

- **Payment is Optional:** The business model does not require mandatory online payment. Customers frequently place orders first and discuss totals, discounts, and parcel transport with Admin before paying.
- **No Payment Status Architecture:** There is **NO** `payment_status` column, payment table, transaction ledger, gateway webhook, or transaction ID in the database.
- **Facility Display Only:** The confirmation screen displays the dynamic `gpay_upi_number` and `gpay_qr_code_url` retrieved from `business_settings` as a payment convenience.
- **Verification Flow:** If a customer chooses to pay via UPI, they send confirmation to Admin via WhatsApp. Admin verifies the credit in their external banking/GPay app and manually updates the order status to `'Confirmed'`.

---

## 14. Shipping & Transportation Boundaries

- **Zero Shipping Database Architecture:** There are **NO** shipping tables, transportation tables, delivery charge columns, freight settings, delivery zones, courier API integrations, or shipping statuses.
- **Business Reality:** Crackers transportation in Tamil Nadu and across India is governed by specialized parcel lorries and transport agencies (e.g. Sivakasi parcel services).
- **Operational Handling:** Customers discuss transport agency preferences, delivery destination, and freight charges directly with Admin over phone or WhatsApp after order placement.

---

## 15. Dynamic Business Settings Specification

The `business_settings` entity maintains runtime business configuration editable by Admin without code deployments.

- **Singleton Enforcement:** The table enforces `CHECK (id = 1)`. Exactly one configuration row exists.
- **Locked Settings Inventory:**
  1. `business_name`: Display trade name ("Amuthavalli Crackers").
  2. `business_logo_url`: Path/URL of store logo in Supabase Storage (`business` bucket).
  3. `business_address`: Physical warehouse/depot address printed on invoices and headers.
  4. `business_mobile`: Primary telephone contact number.
  5. `whatsapp_number`: **Mandatory.** Target WhatsApp number for wa.me link generation.
  6. `gpay_upi_number`: Mobile number or UPI ID (VPA) for customer payment.
  7. `gpay_qr_code_url`: Path/URL of UPI payment QR graphic in Storage (`business` bucket).
  8. `min_order_value`: Minimum order threshold (e.g., ₹3,000.00) enforced during checkout.
- **No Arbitrary Settings:** No generic CMS key-value bloat. Admin passwords belong strictly to Supabase Auth.

---

## 16. Invoice Architecture (Derived Document)

- **No Dedicated Invoice Table:** An invoice is a formatted representation of an order, not a distinct operational entity.
- **Dynamic Derivation:** Invoices are rendered directly from `orders` and `order_items` using:
  - Header: `business_settings` (business name, address, phone, logo).
  - Customer info: Immutable snapshot fields on `orders` (`customer_name`, `customer_phone`, `customer_address`, `customer_city`, `customer_pincode`).
  - Reference: `orders.order_number` (`AMU-XXXXXX`) and `orders.created_at`.
  - Line items: `order_items` (`product_name`, `quantity`, `unit_price`, `total_price`).
  - Total: `orders.total_amount`.
- If an admin negotiates an item price, the order item updates, the order total updates, and the rendered invoice automatically reflects the updated figures while preserving full historical accuracy.

---

## 17. Customer Order History Flow

Admin requires access to customer purchasing history to facilitate relationship management and repeat seasonal orders.

- **No Redundant History Tables:** There is **NO** `customer_history` or `purchase_history` table.
- **Relational Derivation:** Customer history is derived natively through existing relational joins:
  ```
  `customers` (id, mobile, name, current address)
         │
         └──< `orders` (order_number, created_at, status, total_amount, historical snapshot)
                 │
                 └──< `order_items` (product_name, quantity, unit_price, total_price)
  ```
- **Admin History View:** Selecting a customer displays:
  1. Current contact profile from `customers`.
  2. Complete chronological list of orders placed by this customer.
  3. Items, quantities, and negotiated prices for each order.
  4. Instant access to generated invoice documents for past orders.

---

## 18. Storage Asset Architecture

Binary media assets are stored in Supabase Storage buckets, with clean CDN URLs stored in database records.

| Bucket Name | Asset Type | Typical File Format | Referencing Database Column | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| `products` | Cracker product photo (single image) | `.webp`, `.jpg`, `.png` | `products.image_url` | Public Read; Admin Write |
| `business` | Business brand logo | `.webp`, `.png`, `.svg` | `business_settings.business_logo_url` | Public Read; Admin Write |
| `business` | GPay / UPI QR code graphic | `.webp`, `.png`, `.jpg` | `business_settings.gpay_qr_code_url` | Public Read; Admin Write |

*Rules:* Product images are single photos (not galleries). Media deletion in Storage is managed when Admin replaces images.

---

## 19. Source of Truth Matrix

| Data Type | Primary Source of Truth | Consumers / Views |
| :--- | :--- | :--- |
| **Product Master & Selling Rates** | `products` table | Customer catalog, Admin product list |
| **Category Classifications** | `categories` table | Catalog filter tabs, Excel import validator |
| **Current Customer Contact Details** | `customers` table | Admin customer directory, checkout auto-fill |
| **Historical Order Delivery Data** | `orders` table (snapshot columns)| Invoices, order detail modal, parcel shipping labels |
| **Agreed Order Line Pricing** | `order_items` table | Order detail, printable invoice, order total computation |
| **Business Contact & Payment Info** | `business_settings` table | Website header/footer, WhatsApp dispatch, UPI display |
| **Binary Visual Media** | Supabase Storage Buckets | Website UI, WhatsApp QR displays |
| **Transient In-Progress Cart** | Browser Local Storage / Memory | Checkout submission payload |

---

## 20. Security & Data Access Boundaries

### 20.1 Public / Anon Access (Customer Website)
- **`categories`:** Read-only (`SELECT`) via policy `categories_public_select`.
- **`products`:** Read-only (`SELECT`), strictly filtered to `is_available = true` via policy `products_public_select_available`. Inactive products are hidden from public queries.
- **`business_settings`:** Read-only (`SELECT`) for the singleton configuration row (`id = 1`) via policy `business_settings_public_select`. Exposes public branding, contact info, UPI QR, and minimum order threshold.
- **`customers`:** **NO ACCESS (RLS Default-Deny).** Zero direct public policies. Direct anonymous `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are strictly denied by RLS to prevent harvesting of customer PII (phone numbers, addresses) and profile tampering.
- **`orders`:** **NO ACCESS (RLS Default-Deny).** Zero direct public policies. Direct anonymous `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are strictly denied by RLS to prevent price forgery, order total forgery, order status injection, and order data enumeration.
- **`order_items`:** **NO ACCESS (RLS Default-Deny).** Zero direct public policies. Direct anonymous `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are strictly denied by RLS to prevent line-item unit price tampering.
- **Storage:** Read-only (`SELECT`) on public assets (`products` and `business` buckets).

---

### 20.2 Privileged Server-Side Guest Order Creation Path (LOCKED: Next.js Server Action + Supabase Service Role)

**Decision Status: LOCKED — NEXT.JS SERVER ACTION + SERVER-SIDE SUPABASE SERVICE ROLE**

Public customers remain completely unauthenticated guests. Customers submit checkout form data through the public customer website, and the checkout submission is handled exclusively through a **Next.js Server Action** (`'use server'`).

#### 20.2.1 Approved Conceptual Guest Order Flow
```
CUSTOMER
   ↓
PUBLIC CHECKOUT FORM
   ↓
NEXT.JS SERVER ACTION (Server-Side Execution Context)
   ↓
SERVER-SIDE VALIDATION (Zod Schema)
   ↓
VERIFY PRODUCT DATA (Fetch trusted products from DB)
   ↓
VERIFY CURRENT SELLING RATES (Use DB selling_rate, reject client prices)
   ↓
VALIDATE MINIMUM ORDER VALUE (Check against business_settings.min_order_value)
   ↓
RESOLVE CUSTOMER BY MOBILE (Lookup customers.mobile)
   ↓
CREATE / UPDATE CUSTOMER AS REQUIRED (Insert new or update current contact)
   ↓
CREATE ORDER (status = 'New', auto-generated AMU-XXXXXX order_number)
   ↓
CREATE ORDER ITEMS (Preserve product_name & unit_price snapshots)
   ↓
RETURN SAFE ORDER RESULT ({ order_number, id, total_amount })
   ↓
CUSTOMER CONFIRMATION SCREEN
```

#### 20.2.2 Server-Side Responsibilities (Order Creation Boundary)
The Server Action executes strictly on the server and enforces all of the following responsibilities:
1. **Receive Checkout Payload:** Accepts customer contact details and selected item quantities from the client.
2. **Validate Customer Input:** Server-side validation of customer name, 10-digit mobile number, delivery address, city, and pincode using Zod.
3. **Validate Product Selections:** Verifies that all requested product UUIDs exist in the master catalog.
4. **Validate Quantities:** Confirms that all ordered quantities are positive integers (`quantity > 0`).
5. **Fetch Trusted Product Data:** Retrieves trusted product records directly from PostgreSQL via Supabase.
6. **Never Trust Customer-Provided Prices:** Client-provided prices, rates, or line totals are completely ignored and never accepted as authoritative.
7. **Use Database Selling Rates:** Computes line items strictly using current `products.selling_rate` from the database.
8. **Calculate Item Amounts Server-Side:** Enforces `total_price = quantity * unit_price` server-side.
9. **Calculate Order Totals Server-Side:** Sums line totals (`total_amount = sum(order_items.total_price)`) and quantities (`total_quantity = sum(order_items.quantity)`).
10. **Validate Minimum Order Value:** Dynamically fetches `business_settings.min_order_value` and verifies `total_amount >= min_order_value`. If threshold is unmet, aborts transaction with a clear error.
11. **Resolve Customer by Mobile:** Uses `customers.mobile` as the unique business identifier.
12. **Create / Update Customer:** If mobile is new, inserts a new `customers` row; if mobile exists, updates the current profile contact details.
13. **Create Order:** Inserts the order row linking `customer_id`, storing the immutable customer contact snapshot, calculated totals, and setting `status = 'New'`.
14. **Create Order Items:** Inserts line item records linked to the new `order_id`.
15. **Preserve Purchase-Time Snapshots:** Writes `product_name` and `unit_price` directly onto `order_items`.
16. **Preserve Approved Initial Status:** Order status is strictly `'New'`.
17. **Database-Controlled Order Number Generation:** The Server Action allows PostgreSQL sequence `order_number_seq` and column `DEFAULT` to generate the human-facing order number (`AMU-000001`).
18. **No Application Order Number Calculation:** Application code **must NOT** calculate, guess, or assign order numbers.
19. **Return Safe Result Only:** Returns only the minimum required confirmation reference (`order_number`, `id`, `total_amount`) to the customer confirmation view.

#### 20.2.3 Service Role Key Security Boundary
The Server Action utilizes the Supabase Service Role key to execute the privileged multi-table guest order operations:
- **Server-Side Only:** The Service Role key represents a privileged credential that bypasses RLS and is restricted strictly to Node.js server execution contexts.
- **Strict Prohibition of Client Exposure:** The Service Role key **MUST NEVER** be exposed to:
  - Browser code or client components (`'use client'`).
  - Public JavaScript bundles.
  - URL parameters or search queries.
  - LocalStorage or sessionStorage.
  - Cookies accessible to client-side JavaScript.
  - Frontend environment variables (must never begin with `NEXT_PUBLIC_`).
  - Customer-visible API responses or logs.

#### 20.2.4 Transactional Integrity & Orphan Row Prevention
The guest order creation process consists of:
`CUSTOMER` + `ORDER` + `ORDER_ITEMS`
The server-side implementation must guarantee consistency across these records. Partial order creation (e.g. order created without items, or items created without order) is strictly unacceptable. If an error occurs midway, the operation must halt and rollback or safely clean up before reporting a failure.

#### 20.2.5 Explicit Architecture Exclusions
- ❌ **NO PostgreSQL `SECURITY DEFINER` RPC:** PostgreSQL stored procedure RPCs for guest order creation are explicitly rejected and excluded in favor of the Next.js Server Action with Service Role.
- ❌ **NO Public RPC Execution:** No RPC endpoints are granted to `anon` for guest order creation.
- ❌ **NO Anonymous Direct Writes:** Anonymous clients are strictly prohibited from direct `INSERT`, `UPDATE`, or `DELETE` on `customers`, `orders`, and `order_items` (RLS default-deny).
- ❌ **NO Customer Authentication:** Customers never receive Supabase Auth accounts, passwords, sessions, or credentials.
- ❌ **NO Discount / Coupon / Payment Status Architecture:** No discount tables, coupon codes, payment status fields, or client-side price negotiation exist in the checkout flow.

---

### 20.3 Authenticated Admin Access (Admin Panel)
- **Authentication:** Requires an authenticated Supabase user session (`auth.role() = 'authenticated'`).
- **`categories` & `products`:** Full administrative CRUD (`SELECT`, `INSERT`, `UPDATE`, `DELETE` [soft-delete via `is_available = false`]).
- **`customers`:** Full administrative access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for customer directory and order history inspection.
- **`orders`:** Full administrative access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for order review, price negotiation, and status updates.
- **`order_items`:** Full administrative access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for line-item price negotiation.
- **`business_settings`:** Full administrative access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Storage:** Full administrative upload, replace, and delete access.

---

## 21. Entity Lifecycle & Data Flow Matrices

### 21.1 `CATEGORIES`
- **Created by:** Admin (manual Admin UI or confirmed Excel import).
- **Read by:** Public Customers and Authenticated Admin.
- **Updated by:** Admin only.
- **Deleted/Disabled by:** Admin only (deletion blocked if linked to existing products).
- **Trigger:** Catalog organization or introduction of new cracker types.
- **Dependencies:** None.
- **Consumed by:** `products.category_id`, Customer category filter tabs.

### 21.2 `PRODUCTS`
- **Created by:** Admin (manual Admin UI or validated Excel import).
- **Read by:** Public Customers (`is_available = true` only); Admin (all records).
- **Updated by:** Admin only.
- **Deleted/Disabled by:** Admin only (soft-disable via `is_available = false`; hard delete blocked if referenced in orders).
- **Trigger:** Catalog onboarding or price-list revision.
- **Dependencies:** `categories.id`.
- **Consumed by:** Customer catalog, Admin inventory manager, `order_items.product_id`.

### 21.3 `CUSTOMERS`
- **Created by:** Next.js Server Action (via Supabase Service Role) during checkout when a new unique mobile number places an order.
- **Read by:** Admin (customer history management). Next.js Server Action (via Service Role) during checkout mobile resolution.
- **Updated by:** Next.js Server Action (via Service Role) during checkout (syncing current name/address) or Admin.
- **Deleted/Disabled by:** Blocked if linked to existing orders (`RESTRICT`).
- **Trigger:** First-time order placement by a mobile number.
- **Dependencies:** Unique mobile number (`customers.mobile`).
- **Consumed by:** `orders.customer_id`, Admin customer history directory.

### 21.4 `ORDERS`
- **Created by:** Next.js Server Action (via Supabase Service Role) upon validated checkout submission.
- **Read by:** Admin. (Customer receives only confirmation summary `{ order_number, id, total_amount }` from Server Action).
- **Updated by:** Admin only (`status` progression or recalculated `total_amount`).
- **Deleted/Disabled by:** Retained permanently for accounting and order history.
- **Trigger:** Successful checkout form submission and server-side validation.
- **Dependencies:** `customers.id`, `business_settings.min_order_value` validation, trusted `products.selling_rate`.
- **Consumed by:** Admin order dashboard, WhatsApp message generator, printable invoice view.

### 21.5 `ORDER_ITEMS`
- **Created by:** Next.js Server Action (via Supabase Service Role) atomically with parent `orders` record.
- **Read by:** Admin.
- **Updated by:** Admin only (negotiated `unit_price`, triggering `total_price` recalculation).
- **Deleted/Disabled by:** Cascades with order deletion (`ON DELETE CASCADE`).
- **Trigger:** Order placement with validated product quantities and database selling rates.
- **Dependencies:** `orders.id`, `products.id`.
- **Consumed by:** Admin order detail modal, order total calculation, printable invoice view.

### 21.6 `BUSINESS_SETTINGS`
- **Created by:** System initialization script (singleton `id = 1`).
- **Read by:** Public Customers (branding, UPI, contact) and Admin.
- **Updated by:** Admin only.
- **Deleted/Disabled by:** Cannot be deleted (singleton record).
- **Trigger:** System setup.
- **Dependencies:** None.
- **Consumed by:** Global website header/footer, checkout minimum order validator, payment QR display, WhatsApp dispatch button.

---

## 22. Finalized / Locked Architecture Decisions

All previously flagged architectural questions have been **authoritatively finalized and locked**:

| Decision Area | Status | Final Locked Architecture Decision |
| :--- | :--- | :--- |
| **1. Product Code / SKU** | Finalized | **LOCKED: NO separate product code or SKU field.** The database primary key (`id`) is the sole product identity. Excel serial numbers represent initial import sequence only. |
| **2. Category Normalization** | Finalized | **LOCKED: Normalization algorithm defined.** Lowercase, trim, collapse repeated spaces, and basic concatenation matching. Normalization is strictly for validation/matching; canonical display names in `categories.name` are never overwritten. Unmatched categories halt and require explicit Admin confirmation. |
| **3. Product Ordering** | Finalized | **LOCKED: Initial ordering follows Excel sequence.** Future manual reordering in Admin may be supported. No complex sequencing models introduced in Phase 2. |
| **4. Customer Relationship Model** | Finalized | **LOCKED: Dedicated `customers` entity with mobile number uniqueness.** Dual snapshot architecture: `customers` holds current profile; `orders` preserves immutable historical customer contact snapshot at order placement time. |
| **5. Payment Status** | Finalized | **LOCKED: NO payment status field or architecture.** Payment is strictly an optional convenience facility displaying dynamic GPay/UPI info. No payment tables, transaction IDs, or gateway statuses exist. |
| **6. Human-Readable Order Number & Generation** | Finalized | **LOCKED: Sequential `AMU-000001` format via PostgreSQL native sequence (`order_number_seq`) with column `DEFAULT ('AMU-' || LPAD(nextval('order_number_seq')::text, 6, '0'))`.** Database-controlled, atomic, unique identifier assigned automatically by PostgreSQL on row insertion for customer communication and invoice tracking, distinct from technical UUID primary keys. Application code must not calculate order numbers. |
| **7. Public Guest Order Creation Path** | Finalized | **LOCKED: Next.js Server Action + Server-Side Supabase Service Role.** Public customers remain unauthenticated guests. Guest checkout is executed strictly server-side through a Next.js Server Action using the Supabase Service Role key (strictly server-only). Server Action validates inputs, enforces database product selling rates, validates `min_order_value`, resolves/upserts `customers` by mobile, creates `orders` (with database-generated `order_number` via sequence) and `order_items` atomically, and returns a safe order confirmation reference (`order_number`, `id`, `total_amount`). Anonymous direct writes to `customers`, `orders`, and `order_items` remain strictly prohibited (RLS default-deny). PostgreSQL `SECURITY DEFINER` RPC is explicitly excluded. |

---

## 23. Deferred / Future Phase Specifications

The following items are deliberately deferred to future development phases and do not affect the database schema:

1. **Excel Price List File Layout:** The exact spreadsheet column names and structure will be mapped during Phase 4/5 (Excel Import Implementation) once sample vendor price lists are provided.
2. **Admin Manual Reorder UI:** The drag-and-drop or ranking interface for rearranging cracker catalog items will be addressed during Admin Frontend development.

---

## 24. Explicitly Rejected / Prohibited Entities & Mechanisms

The following concepts are **strictly prohibited** from existing in the database schema or execution architecture:

1. ❌ **Carts Table:** Carts are client-side in-memory/browser state.
2. ❌ **Wishlist Table:** Not part of the approved business workflow.
3. ❌ **Customer Auth / Passwords Table:** Customers do not have accounts or logins.
4. ❌ **Customer Profiles / Dashboard Tables:** No customer account portal exists.
5. ❌ **Product Variants Table:** Products are discrete items; no variant trees.
6. ❌ **Product Image Galleries Table:** Single product image only; no gallery tables.
7. ❌ **Product Reviews / Ratings Table:** No public review system.
8. ❌ **Shipping / Courier / Delivery Tables:** Shipping is handled offline directly with Admin.
9. ❌ **Delivery Zones / Distance Calculation Tables:** No dynamic freight calculator.
10. ❌ **Discount / Coupon / Promo Tables:** Discounts exist solely as edited line item `unit_price`.
11. ❌ **Payment Gateway / Transactions Table:** No online banking ledger or gateway transactions.
12. ❌ **Payment Status Column:** No `payment_status` on orders or items.
13. ❌ **Generic CMS / Page Content Tables:** Marketing copy is static in application code.
14. ❌ **Arbitrary Settings Table:** Settings are strictly limited to approved business metadata.
15. ❌ **Invoices Table:** Invoices are dynamically rendered from orders and order items.
16. ❌ **Multi-Admin Roles / Permissions Table:** Standard Supabase Auth is used without custom RBAC.
17. ❌ **Customer History Table:** History is derived relationally (`customers` -> `orders` -> `order_items`).
18. ❌ **Prohibited Order Statuses:** `Awaiting Payment`, `Payment Pending`, `Pending`, `Shipped`, `Delivered`, `Refunded`, `Failed`, `Rejected`.
19. ❌ **PostgreSQL `SECURITY DEFINER` RPC for Guest Order Creation:** Excluded in favor of Next.js Server Action with Service Role.
20. ❌ **Public RPC Execution:** No RPC endpoints exposed for public guest order creation.
21. ❌ **Anonymous Direct Table Writes to `customers`, `orders`, `order_items`:** Prohibited by RLS default-deny.

---

## 25. Final Architecture Verification & Quality Check

| Verification Item | Status | Compliance Confirmation |
| :--- | :--- | :--- |
| **6 Core Entities Defined** | Passed | `categories`, `products`, `customers`, `orders`, `order_items`, `business_settings`. |
| **Dedicated Customers Table** | Passed | `customers` table with unique `mobile` constraint and current contact profile. |
| **Customer Mobile Uniqueness** | Passed | Mobile number is unique business identifier; repeat orders resolve to existing customer. |
| **Historical Customer Snapshot** | Passed | `orders` preserves snapshot of name, phone, address, city, pincode at order time. |
| **Human-Readable Order Number** | Passed | `orders.order_number` specified with `AMU-000001` sequential format backed by PostgreSQL native sequence `order_number_seq` and column `DEFAULT`. |
| **No Product Code / SKU** | Passed | Technical UUID is sole product PK; no sku or business code added. |
| **Order Item Price Snapshot** | Passed | `order_items.unit_price` decoupled from `products.selling_rate` for Admin negotiation. |
| **Only 5 Approved Order Statuses** | Passed | Strict check constraint: `'New'`, `'Confirmed'`, `'Processing'`, `'Completed'`, `'Cancelled'`. |
| **No Payment Status** | Passed | Zero payment status columns, payment tables, or transaction entities. |
| **No Shipping System** | Passed | Zero shipping tables, freight columns, or courier integrations. |
| **No Discount System** | Passed | Zero coupon/discount tables; negotiation handled directly on order item unit prices. |
| **WhatsApp Number in Settings** | Passed | `business_settings.whatsapp_number` is mandatory and dynamic. |
| **Category Normalization Defined** | Passed | Algorithm specified for matching; canonical display name preserved; unmatched requires Admin confirmation. |
| **Initial Product Order from Excel**| Passed | Documented that import follows Excel sequence; serial number is not a SKU. |
| **Customer History Relational** | Passed | Derived via `customers` ──< `orders` ──< `order_items`; no redundant history tables. |
| **Invoices as Order Views** | Passed | Derived dynamically from order and order item records; no invoice table. |
| **Public Guest Order Creation Architecture** | Passed | LOCKED: Next.js Server Action + Supabase Service Role (server-only). Zero client exposure of Service Role key. |
| **RLS Default-Deny on Sensitive Tables** | Passed | Anonymous clients have zero direct SELECT/INSERT/UPDATE/DELETE on `customers`, `orders`, `order_items`. |
| **PostgreSQL RPC Exclusion** | Passed | PostgreSQL `SECURITY DEFINER` RPC explicitly rejected and excluded. |
| **All 7 Architecture Decisions Finalized & Locked** | Passed | All 7 core architecture decisions finalized and locked into schema specification. Zero unresolved decisions remain. |
| **Zero Unauthorized Files Modified**| Passed | Migration files, SQL files, Supabase tables, RLS policies, APIs, and UI files left strictly untouched. |
