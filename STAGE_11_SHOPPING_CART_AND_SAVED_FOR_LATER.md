# Stage 11: Shopping Cart & Saved-For-Later Engine Specification

## Executive Overview
Stage 11 delivers the unified multi-vendor shopping cart and saved-for-later subsystem for the Alight International Multi-Vendor Marketplace. It supports seamless guest cart browsing, automatic cart merging upon customer authentication, real-time multi-vendor price & tax calculations, stock availability validation, and side-by-side saved-for-later lists.

---

## Key Features & Multi-Vendor Cart Architecture

### 1. Unified Guest & Authenticated Cart Management
- **Guest Sessions:** Opaque `guestSessionId` cookie/header tracking enables persistent cart browsing prior to user sign-up or login.
- **Cart Merging:** When a guest user logs in, calling `/api/v1/cart/merge` merges the guest cart items with the existing customer cart (summing duplicate SKU quantities and preserving saved-for-later states).

### 2. Multi-Vendor Grouping & Cart Splitting
- **Seller-Level Grouping:** Cart items are automatically clustered by `vendor_id` into distinct `VendorCartGroupDto` objects with vendor store name, store slug, subtotal, discount, tax, and shipping estimation.
- **Individual Vendor Free Shipping Rules:** Calculates seller shipping thresholds (e.g. Free shipping on orders over ₹10,000 per seller).

### 3. Saved-For-Later Engine
- Customers can move items out of the active checkout cart into a `savedForLaterItems` list without deleting them.
- Items in the saved-for-later section are excluded from active subtotal, tax, and grand total calculations.
- **Price Shift Detection:** Records `priceAtAddition` to alert buyers if an item's price changed while saved.
- One-click restore (`/api/v1/cart/items/{id}/move-to-cart`) revalidates live stock before returning the item to the active cart.

### 4. Real-Time Pricing & Stock Integrity
- Validates quantity against `warehouse_stock` available levels on add, update, and restore.
- Calculates dynamic promotional discounts via `PricingService` and applicable GST/VAT via `TaxCalculationService`.

---

## Schema Changes (`V37__cart_and_saved_for_later_engine.sql`)
1. **`cart_items` Table Extensions:**
   - `is_saved_for_later BOOLEAN NOT NULL DEFAULT FALSE`
   - `price_at_addition NUMERIC(12, 2)`
2. **Indexes Created:**
   - `idx_cart_items_saved` on `cart_items(cart_id, is_saved_for_later)`
   - `idx_carts_user_session` on `carts(user_id, session_id)`

---

## API Surface (`CartController.java`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Get cart with active & saved items | Public / User |
| `POST` | `/api/v1/cart/items` | Add product SKU variant to cart | Public / User |
| `PUT` | `/api/v1/cart/items/{id}` | Update quantity of cart item | Public / User |
| `DELETE` | `/api/v1/cart/items/{id}` | Remove item from cart | Public / User |
| `POST` | `/api/v1/cart/items/{id}/save-for-later` | Move item to saved-for-later | Public / User |
| `POST` | `/api/v1/cart/items/{id}/move-to-cart` | Move saved item back to cart | Public / User |
| `DELETE` | `/api/v1/cart` | Clear entire active cart | Public / User |
| `POST` | `/api/v1/cart/merge` | Merge guest cart into user account | Authenticated |

---

## Integration Tests
- Verified in [`CartAndSavedForLaterIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/cart/CartAndSavedForLaterIntegrationTest.java).
