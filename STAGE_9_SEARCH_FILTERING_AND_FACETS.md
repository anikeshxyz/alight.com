# Stage 9: Advanced Search, Filtering & Multi-Faceted Indexing Specification

## Executive Overview
Stage 9 provides the high-performance search and filtering engine for the Alight International Multi-Vendor Marketplace. It incorporates PostgreSQL Trigram fuzzy matching, composite query indexing, multi-attribute faceted aggregation, real-time stock availability filtering, and typeahead suggestions.

---

## Key Features & Search Capabilities

### 1. Multi-Field Fuzzy & Full-Text Search
- **Weighted Target Fields:** Searches product `title`, `short_description`, `description`, `sku`, `tags`, `category.name`, `brand.name`, and `vendor.store_name`.
- **Trigram GIN Indexes (`pg_trgm`):** Sub-string and typo-tolerant search optimization allowing instant search across millions of catalog items.

### 2. Rich Multi-Faceted Aggregations
- **Category Facets:** Real-time distribution counts across matching categories.
- **Brand Facets:** Dynamic counts of matching brand items.
- **Vendor Facets:** Seller-specific item distribution.
- **Price Brackets:** Dynamic minimum and maximum price range discovery for slider UI rendering.
- **Stock Availability:** Faceted breakdown of `inStockCount` vs `outOfStockCount`.

### 3. Multi-Faceted Filters & Dynamic Sorting
- **Filters Supported:**
  - `q`: Search keyword or query string
  - `categoryId`: Category identifier (matches root or children)
  - `brandId`: Brand identifier
  - `vendorId`: Specific merchant store
  - `minPrice` & `maxPrice`: Real-time price boundary
  - `minRating`: Filter by customer review star threshold
  - `inStock`: Boolean availability filter (`true` for in-stock, `false` for out-of-stock)
- **Sorting Orders:**
  - `relevance` / default (by review count / popularity)
  - `price_asc` / `price_low_to_high`
  - `price_desc` / `price_high_to_low`
  - `newest` (by `createdAt DESC`)
  - `rating` / `top_rated` (by `averageRating DESC`)

### 4. Typeahead Autocomplete Suggestions
- `/api/v1/search/suggestions?q=...` returns instant product previews with title, category, price, and thumbnail image.

---

## Schema Changes (`V35__search_facets_and_indexing.sql`)
1. **Trigram & Composite GIN Indexes:**
   - `idx_products_search_composite` on `products(status, category_id, brand_id, base_price)`
   - `idx_products_title_trgm` on `products USING gin (title gin_trgm_ops)`
   - `idx_products_tags_trgm` on `products USING gin (tags gin_trgm_ops)`
   - `idx_products_sku_trgm` on `products USING gin (sku gin_trgm_ops)`
   - `idx_categories_name_trgm` on `categories USING gin (name gin_trgm_ops)`
   - `idx_brands_name_trgm` on `brands USING gin (name gin_trgm_ops)`

---

## API Endpoints (`SearchController.java`)
| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/search` | `q`, `categoryId`, `brandId`, `vendorId`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `sort`, `page`, `size` | Full-text search with faceted filters |
| `GET` | `/api/v1/search/suggestions` | `q` (min 2 chars) | Autocomplete typeahead product suggestions |

---

## Integration Tests
- Verified in [`ProductSearchIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/search/ProductSearchIntegrationTest.java).
