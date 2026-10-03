# PHASE 10A — CART / CHECKOUT ARCHITECTURE SPECIFICATION

**Project:** Amuthavalli Crackers  
**Phase:** 10A — Customer Cart / Checkout Architecture Finalization  
**Document Status:** LOCKED ARCHITECTURE SPECIFICATION  
**Scope:** Architecture & Boundary Decisions Only (No Implementation)  
**Date:** October 1, 2026  

---

## 1. Checkout Route

- **Approved Route:** `/checkout`
- **Page Nature:** Combined Customer Selected Items + Customer Details + Place Order interface.
- **Approved Flow:**
  $$\text{Product List } (/) \longrightarrow \text{Checkout } (/checkout) \longrightarrow \text{Place Order} \longrightarrow \text{Order Acknowledgement} \longrightarrow \text{WhatsApp}$$
- **Architectural Boundary:**
  - There is **NO separate `/cart` page**.
  - The cart is shared application state consumed across both `/` (Product List) and `/checkout` (Checkout).
  - The customer header cart summary pill routes directly to `/checkout`.

---

## 2. Cart Context (`CartProvider`)

- **Architecture:** A unified React Cart Context (`CartProvider`) positioned at the root customer layout level.
- **Single Source of Truth:**
  - Both the Customer Product List (`/`) and Customer Checkout (`/checkout`) consume the same `useCart()` hook.
  - Changes to product quantities on `/` propagate directly to the cart state.
  - Modifications, item deletions, and "Clear All" on `/checkout` update the same unified cart state.
  - The persistent header cart summary pill (`5 Items | ₹1,520.00`) derives its count and total reactively from this shared state.

---

## 3. `localStorage` Persistence

- **Purpose:** Seamless client-side navigation between `/` and `/checkout` across browser page reloads and tab navigations.
- **Implementation Strategy:**
  - The `CartProvider` serializes minimal cart entries to `localStorage` (e.g., key `amu_customer_cart_v1`).
  - Hydration is handled cleanly on mount with fallback to empty state to avoid SSR hydration mismatches.
- **Security Invariant:**
  - `localStorage` is treated strictly as an **untrusted client-side convenience mechanism**.
  - No client-stored prices or totals from `localStorage` are trusted by the backend.

---

## 4. Cart Storage Data Model

- **Minimum State Representation:**
  The persistent cart stores only the absolute minimum required client-side references:
  ```typescript
  export interface CartItemReference {
    productId: string; // UUID of the cracker product
    quantity: number;  // Positive integer (1 - 1000)
  }

  export interface CartState {
    items: Record<string, number>; // Map: productId -> quantity
  }
  ```
- **Explicit Exclusions:**
  - Client state does NOT store authoritative unit prices.
  - Client state does NOT store authoritative discounts.
  - Client state does NOT store authoritative order amounts.
  - Client state does NOT create any database cart table or record.

---

## 5. Price Trust Boundary

- **Core Invariant:**
  $$\text{CLIENT CART PRICE} \ne \text{AUTHORITATIVE ORDER PRICE}$$
- **Responsibility Separation:**
  1. **Client Responsiveness:** The UI calculates displayed line totals ($\text{quantity} \times \text{selling\_rate}$) and aggregate cart totals purely for immediate visual feedback.
  2. **Server-Side Authority:** When the customer clicks "Place Order", the client submits ONLY `{ productId, quantity }` tuples to the Server Action.
  3. **Backend Recalculation:** The Next.js Server Action (`src/actions/order.ts`) queries the Supabase database for current trusted `products.selling_rate`, recalculates all line totals and order totals, checks `business_settings.min_order_value`, and discards any client-submitted prices.

---

## 6. Order Notes Architecture

- **Locked Decision:** Customer Order Notes MUST be persisted as part of the order in PostgreSQL.
- **Storage Target:**
  $$\text{orders.notes} \quad \text{TEXT NULL}$$
- **Rationale:**
  - The approved client UI (`media_1790853029136.png`) contains an "Order Notes (Optional)" textarea.
  - Order instructions must be preserved in historical order records for Admin review and fulfillment tracking.
  - WhatsApp communication is transient and MUST NOT be the sole or authoritative storage location. The relational database remains the single source of truth.
- **Nullability Rule:**
  - If the customer leaves the field blank or whitespace-only, `orders.notes` stores `NULL`. Empty strings are sanitized to `NULL`.

---

## 7. Order Notes Validation & Security

- **Field Rules:**
  - Status: Optional / Nullable.
  - Maximum Length: 1,000 characters.
  - Character Set: Plain text only.
- **Security Boundaries:**
  - **Zod Validation:** Validated server-side within `GuestOrderSchema`:
    ```typescript
    notes: z.string().trim().max(1000, 'Order notes cannot exceed 1,000 characters').nullish()
    ```
  - **Injection Prevention:** Notes are passed as parameterized arguments to the PostgreSQL stored procedure (`p_notes TEXT DEFAULT NULL`). No dynamic SQL string concatenation is permitted.
  - **No Rich Text / HTML:** Raw HTML tags are not interpreted or rendered. Display in Admin is strictly escaped plain text.
  - **Zero Over-engineering:** No separate `order_notes` tables, note history tables, or internal notes entities are introduced. Exactly one column `orders.notes` is approved.

---

## 8. Database Migration Requirement

- **Approved Migration Identifier:** `20261001000004_add_order_notes.sql`
- **Scope:** Strictly additive DDL.
- **Conceptual Definition:**
  ```sql
  -- Additive column addition to orders table
  ALTER TABLE orders
  ADD COLUMN notes TEXT NULL;
  ```
- **Preservation Invariant:**
  - Migrations `20261001000000`, `20261001000001`, `20261001000002`, and `20261001000003` are LOCKED and MUST NOT be edited, altered, or regenerated.
  - Migration `000004` will be created during the implementation phase under explicit authorization.

---

## 9. Server Action Integration

- **Target Action:** `submitGuestOrder(input: unknown)` in `src/actions/order.ts`.
- **Payload Extension:**
  The input payload schema will accept an optional `notes` field inside `GuestOrderInput`:
  ```typescript
  export interface GuestOrderInput {
    idempotencyKey: string;
    customer: GuestCustomerInput;
    items: GuestOrderItemInput[];
    notes?: string | null;
  }
  ```
- **Transaction Invocation:**
  The Server Action forwards `p_notes` into `create_guest_order`:
  ```typescript
  const { data: orderResult, error: orderError } = await supabase.rpc(
    'create_guest_order',
    {
      p_idempotency_key: payload.idempotencyKey,
      p_customer_name: payload.customer.name,
      p_customer_mobile: payload.customer.mobile,
      p_customer_address: payload.customer.address,
      p_customer_city: payload.customer.city || null,
      p_customer_pincode: payload.customer.pincode || null,
      p_total_quantity: authoritativeTotalQuantity,
      p_total_amount: authoritativeTotalAmount,
      p_items: lineItemsPayload,
      p_notes: payload.notes || null,
    }
  );
  ```

---

## 10. Idempotency Preservation

- Adding `orders.notes` does NOT modify or weaken the idempotency architecture:
  - `orders.idempotency_key UUID NOT NULL UNIQUE` remains authoritative.
  - If a network retry occurs with the same `idempotency_key`, `create_guest_order` detects the existing order and returns the committed record without re-inserting or altering data.
  - Monotonic `order_number` sequence generation remains atomic and uncorrupted.

---

## 11. Duplicate Product Merge

- **Rule:** `DUPLICATE PRODUCT IDS = MERGE`
- **Frontend Representation:**
  - The cart represents products keyed by `productId` (`Record<string, number>`).
  - Adding an existing item increments its quantity rather than creating duplicate row entries.
- **Backend Safety Boundary:**
  - Even if a malicious client or malformed payload submits duplicate product IDs, the Server Action `submitGuestOrder` normalizes and merges them by summing quantities and enforcing the 1,000-unit limit before invoking the database function.

---

## 12. Guest Checkout & Customer Authentication Boundary

- Customer authentication is **NOT** introduced.
- The customer remains an unauthenticated guest.
- Zero customer accounts, passwords, login sessions, or customer registration profiles are created.
- Customer deduplication and resolution continue to operate atomically via unique mobile number in `customers` table during order placement.

---

## 13. Payment Architecture Exclusion

- Zero payment gateways (Razorpay, Stripe, Cashfree, PayTM, etc.) are introduced.
- Zero payment tables, transaction tables, or online verification APIs are introduced.
- Manual GPay/UPI information is purely post-order visual reference belonging to the later approved Order Acknowledgement phase.
- The "Place Order →" button submits the order for owner confirmation; it is **NOT** a payment gateway trigger.

---

## 14. Shipping Architecture Exclusion

- The informational note:
  > *"Your order details will be shared with the owner for confirmation. Transportation charges are to be handled by the customer."*
  is strictly an **informational client-side notice**.
- Zero shipping charges, transportation tables, delivery zone matrices, courier integrations, or distance calculations are introduced into the codebase or database.
