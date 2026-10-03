# Phase 5 — Supabase Storage Architecture Specification

**Project:** Amuthavalli Crackers  
**Phase:** Phase 5 — Supabase Storage Implementation  
**Status:** IMPLEMENTED (Migration Created)  
**Authoritative Migration:** `supabase/migrations/20261001000002_create_storage_infrastructure.sql`  
**Authoritative Cross-Reference:** `docs/database-architecture.md`  

---

## 1. Scope

This document establishes the **final locked Supabase Storage Architecture** for dynamic binary media assets in the **Amuthavalli Crackers** web application.

It defines:
- The exact bucket architecture and namespace segregation.
- Stable object path hierarchies and identity conventions.
- Uniform file format rules and the mandatory hard file-size cap.
- Security boundaries, public read models, and administrative write authorization.
- Lifecycle flows for uploads, image replacements, and object deletions.
- Database URL reference mapping and orphan handling guidelines.

**Strict Boundary:** This phase establishes the **Storage infrastructure and policies migration only** (`20261001000002_create_storage_infrastructure.sql`). No upload APIs, Server Actions, frontend UI, Admin pages, or upload components are created during this phase.

---

## 2. Approved Storage Assets

In strict accordance with the locked project architecture, **only three (3) dynamic binary asset categories** are approved for Supabase Storage:

| # | Asset Category | Description | Referencing Database Column | Consumers |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Product Images** | Exactly one product image per catalog item (optional; `image_url` can be `NULL`). | `products.image_url` | Customer Catalog, Admin Product List |
| **2** | **Business Logo** | Exactly one active business brand logo graphic. | `business_settings.business_logo_url` | Website Header, Website Footer, Invoices |
| **3** | **GPay / UPI QR Code** | Exactly one active static UPI payment QR code graphic for optional payment. | `business_settings.gpay_qr_code_url` | Checkout Confirmation Screen |

**Strict Asset Boundaries:**
- No product galleries, multi-image arrays, or `product_images` tables.
- No multiple active logos or logo history tables.
- No multiple active QR codes or QR history tables.
- Absolutely zero additional storage categories (no customer documents, invoice files, order attachments, payment receipts, shipping documents, promotional banners, avatars, videos, or arbitrary media).

---

## 3. Bucket Architecture — LOCKED

Dynamic media is partitioned into **two (2) separate Supabase Storage buckets**. This two-bucket architecture is formally locked now in **Phase 5**:

```
+───────────────────────────────────────────────────────────────────────────────────+
|                             SUPABASE STORAGE SERVICE                              |
+─────────────────────────────────────────+─────────────────────────────────────────+
|                                         |                                         |
|  BUCKET 1: `products`                   |  BUCKET 2: `business`                   |
|  - Public Read: YES                     |  - Public Read: YES                     |
|  - Authenticated Admin Write: YES       |  - Authenticated Admin Write: YES       |
|  - Scope: Product images only           |  - Scope: Business-owned public assets  |
|                                         |                                         |
+─────────────────────────────────────────+─────────────────────────────────────────+
```

### Final Bucket Structure:
```
products
    └── product image objects

business
    ├── logo/
    │   └── active business logo
    └── payment/
        └── active GPay / UPI QR
```

- **Bucket 1 (`products`):** Dedicated exclusively to product catalog images.
- **Bucket 2 (`business`):** Dedicated exclusively to business-owned public assets, logically partitioned into `business/logo/` and `business/payment/`.
- Single "media" bucket is **strictly rejected**.
- Additional buckets are **strictly prohibited**.

---

## 4. Folder / Object Path Strategy

Every asset is assigned a stable, deterministic Storage object identity:

```
[products bucket]
  └── <product_uuid>/
       └── image

[business bucket]
  ├── logo/
  │    └── logo
  └── payment/
       └── qr
```

- **Product Image:** Stored at `products/<product_uuid>/image`
- **Business Logo:** Stored at `business/logo/logo`
- **GPay / UPI QR Code:** Stored at `business/payment/qr`

---

## 5. File Naming Strategy

### 5.1 Stable Object Identity (Extension Decoupled)
The Storage object identity is completely decoupled from the file extension:
- **Product Image:** `products/<product_uuid>/image` (using the product UUID as the stable entity identity).
- **Business Logo:** `business/logo/logo`
- **GPay / UPI QR Code:** `business/payment/qr`

**Rationale for Omitting File Extensions from Object Paths:**
A product photo or company logo may change format (e.g. from PNG to WebP or JPG) when replaced. By decoupling the Storage object identity from the file extension, the object identity remains permanently stable regardless of format changes. The actual media format and content type are determined by the uploaded file's MIME type metadata (`content-type: image/webp`).

### 5.2 Prohibition of Raw User Filenames
Client-supplied original filenames (e.g. `IMG_20261001_104231.jpg`, `crackers_box_final (1).PNG`) are **strictly prohibited** from being used as storage object paths. Raw filenames introduce special characters, whitespace, encoding bugs, path traversal vulnerabilities, and security risks.

### 5.3 Prohibition of Timestamp Filenames
Timestamp-based filenames (e.g. `logo_1727764800.png` or `qr_20261001.webp`) are **strictly prohibited** as the permanent storage architecture. Stable object identities preserve the "one active asset" rule without creating multiple active or unmanaged objects.

---

## 6. File Format Rule — LOCKED

The **ONLY** supported upload formats across the entire application are:

- **PNG** (`image/png`, `.png`)
- **JPG** (`image/jpeg`, `.jpg`)
- **JPEG** (`image/jpeg`, `.jpeg`)
- **WebP** (`image/webp`, `.webp`)

This rule applies consistently to **all three approved asset categories**:
1. Product Images
2. Business Logo
3. GPay / UPI QR Code

**Explicitly Disallowed Formats:**
❌ **SVG** is strictly prohibited (including for logos) to maintain consistent format rules, eliminate XML parsing overhead, and eliminate stored Cross-Site Scripting (XSS) risks.  
❌ **GIF**, ❌ **BMP**, ❌ **TIFF**, ❌ **PDF**, ❌ **Videos**, and ❌ **Arbitrary file types** are strictly rejected.

The application must reject any upload attempt with an unsupported extension or MIME type.

---

## 7. File Size Rule — LOCKED

- **Absolute Maximum File Size:** **800 KB** (Hard Limit).
- **Scope:** Applies uniformly to Product Images, Business Logo, and GPay / UPI QR Code.
- **Enforcement:**
  - Any file larger than 800 KB **MUST BE REJECTED**.
  - The restriction must be enforced both client-side and at the server/Storage policy level during upload.
  - The Admin UI must clearly display: **"Maximum file size: 800 KB"**.
  - If a user attempts to upload a file exceeding 800 KB, the upload must fail immediately, and the file must never become an accepted active asset.
- **Prohibited Sizes:** Limits of 1 MB, 2 MB, 5 MB, or arbitrary thresholds are **strictly rejected**. The approved limit is exactly **800 KB**.

---

## 8. Public vs Private Access Model

| Bucket Name | Customer Read Access | Admin Write Access | Architectural Justification |
| :--- | :---: | :---: | :--- |
| **`products`** | **PUBLIC READ** | **AUTHENTICATED ADMIN ONLY** | Unauthenticated public customers browse the cracker catalog and must render product images without authentication headers, cookies, or signed tokens. Admin alone has write privileges. |
| **`business`** | **PUBLIC READ** | **AUTHENTICATED ADMIN ONLY** | The business logo is displayed in the public header and footer. The GPay QR code is rendered on the public checkout confirmation screen to unauthenticated guest buyers. Admin alone has write privileges. |

- Public read access **DOES NOT** imply public write access.
- Anonymous users have strictly read-only access.
- Neither bucket stores sensitive user documents, financial records, or PII. Presigned URLs are unnecessary.

---

## 9. Anonymous Customer Permissions

In complete alignment with Phase 4 RLS:

- **`SELECT` (Read):** **ALLOWED** on `products` and `business` buckets via public storage policies.
- **`INSERT` (Upload):** **DENIED.** Anonymous users cannot upload files.
- **`UPDATE` (Replace):** **DENIED.** Anonymous users cannot overwrite or modify existing files.
- **`DELETE` (Remove):** **DENIED.** Anonymous users cannot delete files.

---

## 10. Admin Permissions

Authenticated Store Administrators (`auth.role() = 'authenticated'`):

- **`SELECT` (Read):** **ALLOWED.** Full read access to all objects in both buckets.
- **`INSERT` (Upload):** **ALLOWED.** Can upload new product photos, logos, and QR codes.
- **`UPDATE` (Replace):** **ALLOWED.** Can replace existing images with updated graphics.
- **`DELETE` (Remove):** **ALLOWED.** Can delete obsolete images from storage.

---

## 11. Database Reference Strategy

### 11.1 Columns in Schema (Unchanged)
The approved PostgreSQL schema contains exactly three URL reference columns:
- `products.image_url` (`TEXT`, Nullable)
- `business_settings.business_logo_url` (`TEXT`, Nullable)
- `business_settings.gpay_qr_code_url` (`TEXT`, Nullable)

**Schema Preservation:**
- Zero new columns added (no `storage_path`, `image_hash`, etc.).
- Zero new tables added (no `product_images`, `assets`, `media`, `versions`).
- Column types remain strictly `TEXT`.

### 11.2 Storage Object Identity vs Database-Stored URL Reference
The architecture strictly distinguishes:
1. **Storage Object Identity / Path:** The internal canonical location inside Supabase Storage:
   - `products/<product_uuid>/image`
   - `business/logo/logo`
   - `business/payment/qr`
2. **Database-Stored URL Reference:** The full, clean public CDN URL stored in the database column:
   ```
   https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
   ```

#### Examples:
- `products.image_url`:  
  `https://<project-ref>.supabase.co/storage/v1/object/public/products/<product_uuid>/image`
- `business_settings.business_logo_url`:  
  `https://<project-ref>.supabase.co/storage/v1/object/public/business/logo/logo`
- `business_settings.gpay_qr_code_url`:  
  `https://<project-ref>.supabase.co/storage/v1/object/public/business/payment/qr`

#### Architectural Advantages:
- **Zero Runtime Resolution:** Web pages and components consume the URL directly without making runtime API calls to resolve storage paths.
- **Nullable Semantics:** If an item has no image (e.g. new product without photo), `image_url` is `NULL`, triggering the frontend to render the local static placeholder asset (`/images/placeholder-cracker.webp`).

---

## 12. Upload Lifecycle

```
[ Admin in Admin Panel ]
          │
          │ 1. Selects image file (.webp, .jpg, .jpeg, .png)
          v
[ Validation Engine ]
          │ 2. Asserts format (PNG/JPG/JPEG/WebP) AND file size (<= 800 KB)
          v
[ Supabase Storage API ] ──> [ Storage RLS: Authenticated Admin Check ]
          │ 3. Uploads binary data to stable path (e.g. products/<uuid>/image)
          v
[ Obtain Public CDN URL ]
          │ 4. supabase.storage.from(bucket).getPublicUrl(path)
          v
[ PostgreSQL Database ]
          │ 5. UPDATE table SET <url_column> = <cdn_url> WHERE id = ...
          v
[ Complete ]
```

---

## 13. Replacement Lifecycle

Replacement strictly preserves the **"one active asset"** rule:

### 13.1 Product Image Replacement (`products/<product_uuid>/image`):
- When Admin replaces the product image:
  1. The new upload becomes the active image at `products/<product_uuid>/image`.
  2. Database `products.image_url` is updated to the active object reference.
  3. The previous object must not remain as an unintended orphan.
  4. No image history is retained.

### 13.2 Business Logo Replacement (`business/logo/logo`):
- When Admin replaces the logo:
  1. The new upload becomes the active logo at `business/logo/logo`.
  2. Database `business_settings.business_logo_url` is updated.
  3. The previous logo must not remain as an unintended orphan.
  4. No logo history is retained.

### 13.3 GPay / UPI QR Replacement (`business/payment/qr`):
- When Admin replaces the QR code:
  1. The new upload becomes the active QR code at `business/payment/qr`.
  2. Database `business_settings.gpay_qr_code_url` is updated.
  3. The previous QR code must not remain as an unintended orphan.
  4. No QR history is retained.

*Important Note:* Stable object paths do not automatically guarantee zero orphaned objects by themselves. The future implementation must explicitly handle the replacement flow safely so that failed replacements do not corrupt existing active assets.

---

## 14. Deletion Lifecycle

### 14.1 Product Soft-Deactivation vs Image Deletion
- **Soft Deactivation (`is_available = false`):** When Admin deactivates a product, the product image is **NOT** deleted from Storage. The image remains intact in storage and referenced in `products.image_url` so that when the product is reactivated for the next Diwali season, the photo is immediately available.
- **Explicit Image Removal:** If Admin explicitly removes the image from an active product:
  1. Database column `products.image_url` is set to `NULL`.
  2. The storage object at `products/<product_uuid>/image` is removed from the bucket.
- **Logo / QR Code Removal:** If logo or QR code is explicitly cleared:
  1. Database column is set to `NULL`.
  2. Associated storage object is removed from the `business` bucket.

---

## 15. Orphan Handling

The architecture explicitly acknowledges:
Storage objects and database URL references can become inconsistent if replacement or deletion is implemented incorrectly.

### Mandatory Rules for Future Implementation:
1. **Upload Verification First:** The new asset must be successfully uploaded and available before updating the database reference.
2. **Database Update Second:** The database reference must be updated correctly.
3. **Previous Asset Removal:** The previous active asset is safely removed when appropriate.
4. **Resilience to Replacement Failure:** A failed replacement must not leave the database pointing to a missing or broken asset.
5. **Resilience to Upload Failure:** A failed upload must not destroy or overwrite the currently active asset.

**Strict Architecture Exclusions:**
- Do **NOT** invent background cleanup jobs.
- Do **NOT** create cron jobs.
- Do **NOT** create Edge Functions.
- Do **NOT** create a separate cleanup microservice.
If cleanup beyond the replacement lifecycle is needed later, it must be handled as a separate approved implementation decision.

---

## 16. Cache / Replacement Consideration

Because stable object paths (`products/<uuid>/image`, `business/logo/logo`, `business/payment/qr`) are being used:
- Browser and CDN caching must be considered during the implementation phase.
- **Implementation Requirement:** "Replacement implementation must ensure that customers receive the newly uploaded asset rather than a stale cached version."
- *Note:* The specific cache-busting mechanism (e.g. cache-control headers, query parameter versioning, or upload options) will be addressed during implementation. No unapproved mechanism is invented here.

---

## 17. Security Model

1. **Service Role Key Isolation:** Storage operations in the Admin frontend execute using standard authenticated Supabase user sessions (`supabase.storage`). The `SUPABASE_SERVICE_ROLE_KEY` is **NEVER** exposed to:
   - Browser code or client components (`'use client'`).
   - `NEXT_PUBLIC_` environment variables.
   - LocalStorage or sessionStorage.
   - Client-accessible cookies.
   - URLs or query parameters.
   - Customer-visible responses or client logs.
2. **Storage RLS Enforcement:** Anonymous customers cannot execute `INSERT`, `UPDATE`, or `DELETE` on storage objects.
3. **Admin Authentication Boundary:** Admin write operations require a verified Supabase Auth session (`authenticated`). No custom admin-role tables or secondary role schemas exist.
4. **Hard Size & Format Enforcement:** Files exceeding 800 KB or possessing non-approved MIME types are rejected at the security boundary.

---

## 18. Storage Policy Requirements

The following RLS policies must be applied to `storage.objects` during the implementation phase:

### 18.1 Bucket: `products`
```sql
-- 1. Public Read: Anyone (anonymous and authenticated) can view product photos.
CREATE POLICY "products_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- 2. Admin Insert: Authenticated store admins can upload product photos.
CREATE POLICY "products_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- 3. Admin Update: Authenticated store admins can replace product photos.
CREATE POLICY "products_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- 4. Admin Delete: Authenticated store admins can delete product photos.
CREATE POLICY "products_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

### 18.2 Bucket: `business`
```sql
-- 1. Public Read: Anyone (anonymous and authenticated) can view business logo & QR.
CREATE POLICY "business_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business');

-- 2. Admin Insert: Authenticated store admins can upload logo and QR codes.
CREATE POLICY "business_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business');

-- 3. Admin Update: Authenticated store admins can replace logo and QR codes.
CREATE POLICY "business_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business')
WITH CHECK (bucket_id = 'business');

-- 4. Admin Delete: Authenticated store admins can delete logo and QR codes.
CREATE POLICY "business_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business');
```

---

## 19. Explicitly Excluded Storage

The following storage concepts and asset types are **strictly prohibited**:

1. ❌ **Customer Uploads / Storage:** No customer file uploads or customer folders.
2. ❌ **Private Customer Files:** No customer documents or identity proofs.
3. ❌ **Order Attachments / Payment Receipts:** Customers share UPI payment confirmations externally via WhatsApp; no receipt storage in Supabase.
4. ❌ **Invoices as Storage Files:** Invoices are dynamically generated visual documents; no PDFs are stored.
5. ❌ **Shipping / Transport Waybills:** Transport arrangements are offline; no shipping documents stored.
6. ❌ **Product Image Galleries:** Exactly one image per product; no multi-image galleries.
7. ❌ **Image / Logo / QR History:** No version history tables or historical file archives.
8. ❌ **Promotional Banners:** Marketing assets are bundled statically with frontend code.
9. ❌ **User / Admin Avatars:** No profile photo uploads.
10. ❌ **Video Storage:** No cracker demonstration videos.
11. ❌ **Arbitrary File Storage:** No general-purpose file hosting.
12. ❌ **External Storage Providers:** No AWS S3, Cloudinary, or Google Cloud Storage buckets.
13. ❌ **Storage RPCs / Edge Functions:** No serverless functions or database triggers for storage.
14. ❌ **Storage Cleanup Cron Jobs:** No automated background cleanup jobs.

---

## 20. Unresolved Decisions: NONE

All previously flagged architectural options have been **authoritatively finalized and locked**:

1. **Bucket Structure:** **LOCKED.** Two dedicated buckets: `products` and `business`.
2. **Supported File Formats:** **LOCKED.** Strictly PNG, JPG, JPEG, WebP across all three asset categories. SVG is strictly excluded.
3. **Maximum File Size Limit:** **LOCKED.** Exactly **800 KB** hard cap across all three asset categories.
4. **Object Path & Identity Strategy:** **LOCKED.** Stable object identities decoupled from file extensions:
   - Product: `products/<product_uuid>/image`
   - Business Logo: `business/logo/logo`
   - GPay / UPI QR: `business/payment/qr`
5. **Replacement Strategy:** **LOCKED.** Replaces active asset while ensuring previous asset is not left as an orphan.
6. **Access Boundary:** **LOCKED.** Public read for customers; authenticated Admin write/update/delete; anonymous write prohibited.

**There are ZERO (0) unresolved storage architecture decisions remaining.**

---

## 21. Final Architecture Summary

| Dimension | Specification | Locked Status |
| :--- | :--- | :---: |
| **Buckets** | `products` (Product photos)<br>`business` (`logo/` and `payment/`) | **LOCKED** |
| **Product Image** | Exactly one image (optional, `NULL` allowed)<br>Path: `products/<product_uuid>/image`<br>Formats: PNG, JPG, JPEG, WebP<br>Max Size: **800 KB** | **LOCKED** |
| **Business Logo** | Exactly one active logo<br>Path: `business/logo/logo`<br>Formats: PNG, JPG, JPEG, WebP<br>Max Size: **800 KB**<br>Replacement removes/replaces previous active asset | **LOCKED** |
| **GPay / UPI QR** | Exactly one active QR<br>Path: `business/payment/qr`<br>Formats: PNG, JPG, JPEG, WebP<br>Max Size: **800 KB**<br>Replacement removes/replaces previous active asset | **LOCKED** |
| **Access Model** | Public Read for customer-facing assets<br>Authenticated Admin write / update / delete<br>Anonymous write / update / delete prohibited | **LOCKED** |
| **Database Integration** | Existing columns unchanged (`products.image_url`, `business_logo_url`, `gpay_qr_code_url`)<br>Zero new tables, zero new columns | **LOCKED** |
| **Unresolved Decisions** | **NONE** | **LOCKED** |
