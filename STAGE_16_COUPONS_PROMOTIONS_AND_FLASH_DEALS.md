# Stage 16: Coupons, Promotions, Flash Deals & Referral Engine

## 1. Architectural Overview

The **Coupons, Promotions, Flash Deals & Referral Engine** provides an enterprise-grade discount calculation and promotional engine for the Alight International Multi-Vendor Marketplace. It ensures exact arithmetic precision, granular scoping (Global, Vendor, Category, Product, First Order), fair multi-vendor proportional discount splitting, usage quota enforcement, and time-bounded promotional flash campaigns.

```
                                  +-----------------------------+
                                  |   Customer Cart / Checkout  |
                                  +--------------+--------------+
                                                 |
                                     (Apply Coupon Code)
                                                 |
                                                 v
                               +----------------------------------+
                               |          CouponService           |
                               +-----------------+----------------+
                                                 |
                +--------------------------------+--------------------------------+
                |                                |                                |
                v                                v                                v
    +-----------------------+        +-----------------------+        +-----------------------+
    |  Eligibility & Scopes |        |  Discount Calculation |        | Multi-Vendor Breakdown|
    |  - Global             |        |  - Percentage w/ Cap  |        | - Split proportionally|
    |  - Vendor             |        |  - Flat Fixed Amount  |        |   across eligible     |
    |  - Category / Product |        |  - Free Shipping      |        |   sub-order subtotals |
    |  - FIRST_ORDER Only   |        |  - Min Order Check    |        +-----------------------+
    +-----------------------+        +-----------------------+
```

---

## 2. Core Entities & Database Schema (`V42__coupons_promotions_and_flash_deals.sql`)

### 2.1 Coupons (`coupons`)
- **`code`**: Unique uppercase code index (e.g., `SUMMER20`, `WELCOME100`).
- **`discount_type`**: `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`.
- **`discount_value`**: Numerical value of discount (percentage rate or fixed amount).
- **`max_discount_amount`**: Upper ceiling cap for percentage discounts.
- **`min_order_amount`**: Minimum eligible cart subtotal threshold required.
- **`scope`**: `GLOBAL`, `VENDOR`, `CATEGORY`, `PRODUCT`, `FIRST_ORDER`.
- **`usage_limit_total` & `usage_limit_per_user`**: Global and per-account redemption limits.
- **`referral_user_id`**: Associated user for customer referral discount attribution.
- **`terms_and_conditions`**: Legal and policy disclosure text.

### 2.2 Coupon Usages (`coupon_usages`)
- Tracks per-order coupon redemptions (`coupon_id`, `user_id`, `order_id`, `discount_amount`, `used_at`).

### 2.3 Promotions & Flash Deals (`promotions`)
- **`banner_tag`**: Tag identifier (e.g., `HERO_BANNER`, `FLASH_DEAL`, `FESTIVAL_OFFER`).
- **`badge_text` & `discount_text`**: Visual pill labels and copy for storefront carousels.
- **`start_time` & `end_time`**: ISO-8601 validity windows for automated deal expiration.
- **`display_order`**: Priority sequence for homepage and category banner sorting.

---

## 3. Discount Allocation & Multi-Vendor Mechanics

When a coupon is applied to a multi-vendor cart:
1. **Scope Filtering**: Items are evaluated against the coupon's scope.
   - For `GLOBAL` or `FIRST_ORDER`, all items are eligible.
   - For `VENDOR`, only items matching the coupon's vendor are eligible.
   - For `CATEGORY` / `PRODUCT`, only matching catalog items are eligible.
2. **Minimum Order Threshold**: The sum of eligible item line totals must meet `min_order_amount`.
3. **Discount Computation**:
   - **Percentage**: `(eligibleSubtotal * discountValue / 100).min(maxDiscountAmount)`.
   - **Fixed Amount**: `discountValue.min(eligibleSubtotal)`.
   - **Free Shipping**: Sets shipping total to 0.
4. **Multi-Vendor Proportional Splitting**:
   - For each eligible vendor sub-order, discount is split as:
     $$\text{Vendor Discount} = \text{Total Discount} \times \frac{\text{Vendor Eligible Subtotal}}{\text{Total Eligible Subtotal}}$$
   - Guarantees exact reconciliation on vendor sub-orders, payout calculations, and escrow deposits.

---

## 4. Verification & Integration Suite

Verified via [`CouponsAndPromotionsIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/coupon/CouponsAndPromotionsIntegrationTest.java):
- [x] **Global Percentage Discount**: Max cap enforcement.
- [x] **Fixed Amount Discount**: Minimum order threshold validation.
- [x] **Free Shipping Coupon**: Shipping fee waiver calculation.
- [x] **Multi-Vendor Scoped Coupon**: Proportional vendor discount breakdown.
- [x] **First-Time Buyer Restriction**: `FIRST_ORDER` scope checking.
- [x] **Redemption Limits**: Per-user and global quota enforcement via `coupon_usages`.
- [x] **State Transitions**: Active/Inactive toggling and expiration date validation.
- [x] **Admin & Vendor CRUD**: Full administrative lifecycle and stats queries.
- [x] **Promotion Banners & Flash Deals**: Scheduling and display ordering.
- [x] **End-to-End Checkout**: Coupon deduction on checkout and order creation.
