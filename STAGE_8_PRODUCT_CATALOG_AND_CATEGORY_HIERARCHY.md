# Stage 8: Product Catalog & Multi-Level Category Hierarchy Specification

## Executive Overview
Stage 8 delivers the multi-tenant product catalog and category taxonomy engine for the Alight International Multi-Vendor Marketplace. It powers self-referencing category trees, brand discovery, multi-variant SKU matrices, tax HSN/SAC classifications, and vendor-scoped product lifecycles.

---

## Key Features & Architectural Highlights

### 1. Multi-Level Category Hierarchy
- **Recursive Tree Structure:** Infinite nesting depth with self-referencing `parent_id` foreign keys and optimized ordering via `display_order ASC, name ASC`.
- **Category Commission Overrides:** Categories can define specific commission rates (e.g. 6.00% on Smartphones, 12.00% on Jewelry) that override default vendor commission tiers.
- **Hierarchical Tree API:** Single-call tree retrieval (`/api/v1/categories/tree`) designed for responsive mega-menus and mobile navigation drawers.

### 2. Brand Ecosystem
- **Brand Management:** Dedicated brand registry with slugs, high-resolution logos, banners, official website links, and featured flags.
- **Admin & Public APIs:** Administrative brand curation and public brand directory for storefront filtering.

### 3. Rich Multi-Variant SKU Engine
- **Product Metadata:** Multi-language short and full Markdown descriptions, search tags, HSN/SAC tax codes, and low stock threshold alerts.
- **Multi-Variant SKU Matrices:** Variants track individual SKU, variant name, barcode (UPC/EAN/GTIN), real-time price, compare-at price, weight in grams, dimensions, variant-specific image URL, and structured JSON attributes.
- **Dynamic Attribute Specifications:** Extensible key-value attribute system (e.g. Material, Screen Size, Processor, Warranty) rendered with custom display ordering.
- **Gallery Images:** Multiple image support with primary thumbnail designation and sort ordering.

### 4. Vendor Lifecycle & Admin Moderation
- **Product States:** `DRAFT` $\to$ `PENDING_APPROVAL` $\to$ `APPROVED` (Published) / `REJECTED` / `ARCHIVED`.
- **Multi-Tenant Security:** Vendors can only view, modify, and delete products belonging to their store.
- **Admin Review Queue:** Administrators can inspect submitted products, approve for live marketplace listing, or reject with a detailed correction notice.

---

## Database Migrations (`V34__product_catalog_and_category_hierarchy.sql`)
1. **`categories` Table:**
   - `commission_percentage NUMERIC(5, 2)`
2. **`brands` Table:**
   - `is_featured BOOLEAN NOT NULL DEFAULT FALSE`
3. **`products` Table:**
   - `hsn_code VARCHAR(50)`
   - `tags TEXT`
   - `low_stock_threshold INT NOT NULL DEFAULT 5`
4. **`product_variants` Table:**
   - `barcode VARCHAR(100)`
   - `compare_at_price NUMERIC(12, 2)`
   - `weight_grams NUMERIC(10, 2)`
   - `image_url VARCHAR(512)`

---

## API Surface
| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Category** | `GET` | `/api/v1/categories/tree` | Full public hierarchical tree |
| **Category** | `GET` | `/api/v1/categories/{parentId}/subcategories` | Get direct child subcategories |
| **Category** | `GET` | `/api/v1/categories/{slug}` | Public category detail by slug |
| **Brand** | `GET` | `/api/v1/brands` | List active marketplace brands |
| **Brand** | `GET` | `/api/v1/brands/{slug}` | Public brand storefront detail |
| **Vendor Products** | `GET` | `/api/v1/vendor/products` | Vendor's catalog with status filtering |
| **Vendor Products** | `POST` | `/api/v1/vendor/products` | Create product with variants & images |
| **Vendor Products** | `PUT` | `/api/v1/vendor/products/{id}` | Update product specifications & SKU |
| **Vendor Products** | `PUT` | `/api/v1/vendor/products/{id}/submit` | Submit for administrator review |
| **Admin Products** | `PUT` | `/api/v1/admin/products/{id}/status` | Approve or reject vendor product |

---

## Verification & Integration Tests
- Integration tests in [`ProductCatalogIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/product/ProductCatalogIntegrationTest.java).
