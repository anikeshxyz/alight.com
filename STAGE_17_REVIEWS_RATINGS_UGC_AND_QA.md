# Stage 17: Reviews, Ratings, UGC & Community Q&A Engine

## 1. Architectural Overview

The **Reviews, Ratings, UGC & Community Q&A Engine** establishes trustworthy social proof, verified purchaser recognition, multi-criteria ratings, media attachments, vendor interaction, and administrative moderation across the Alight International Multi-Vendor Marketplace.

```
                              +--------------------------+
                              |   Product Detail Page    |
                              +-------------+------------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
             +-----------------------+             +-----------------------+
             |     ReviewService     |             |    ProductQaService   |
             +-----------+-----------+             +-----------+-----------+
                         |                                     |
        +----------------+----------------+           +--------+--------+
        |                |                |           |                 |
        v                v                v           v                 v
   +----------+    +----------+    +----------+  +----------+     +----------+
   | Verified |    | Rating   |    | Helpful  |  | Question |     | Answer   |
   | Purchase |    | Summary  |    | Upvotes  |  | Upvotes  |     | Verified |
   | Gating   |    | Stats    |    | /Toggles |  | Tracking |     | Seller   |
   +----------+    +----------+    +----------+  +----------+     +----------+
```

---

## 2. Core Components & Database Structure (`V43__reviews_ratings_and_qa_enhancements.sql`)

### 2.1 Customer Reviews (`reviews`)
- **`product_id` & `user_id`**: Enforces a strict one-review-per-customer constraint per product (`uq_product_user_review`).
- **`rating`**: 1 to 5 star rating scale.
- **`is_verified_purchase`**: Dynamically verified against customer order item fulfillment records.
- **`images`**: JSONB array storing uploaded UGC photo URLs.
- **`status`**: Moderation lifecycle (`APPROVED`, `PENDING_MODERATION`, `REJECTED`, `FLAGGED_SPAM`).
- **`helpful_count` & `unhelpful_count`**: Aggregated community voting totals.
- **`vendor_response` & `vendor_responded_at`**: Official store response thread.

### 2.2 Review Helpfulness Voting (`review_votes`)
- Tracks unique user votes per review (`uq_review_user_vote`). Supports switching between `HELPFUL` and `UNHELPFUL`, as well as toggling off.

### 2.3 Community Q&A Threads (`product_questions` & `product_answers`)
- Customers can post pre-purchase questions (`product_questions`).
- Answers (`product_answers`) can be posted by vendors, platform admins, or verified buyers.
- Vendors and verified sellers automatically receive official badges (`is_verified_seller = true`, `is_accepted = true`).

---

## 3. Product Rating Aggregation Engine

Whenever a review is created, updated, or moderated:
1. `ReviewServiceImpl.updateProductRatingCache(productId)` executes:
   - Fetches all `APPROVED` reviews for the product.
   - Calculates the exact arithmetic mean rounded to 2 decimal places:
     $$\text{Average Rating} = \frac{\sum \text{Ratings}}{\text{Total Approved Reviews}}$$
   - Atomically updates `products.average_rating` and `products.review_count`.

---

## 4. Verification & Integration Suite

Verified via [`ReviewsRatingsAndQaIntegrationTest.java`](file:///c:/Users/kulde/OneDrive/Desktop/alight.com/backend/src/test/java/com/alight/marketplace/modules/review/ReviewsRatingsAndQaIntegrationTest.java):
- [x] **Verified Purchase Recognition**: Verified buyers receive badges while unverified users can post normal reviews.
- [x] **Product Rating Cache Sync**: Automatic recalculation of `products.average_rating` and `products.review_count`.
- [x] **Rating Statistics Breakdown**: 1-5 star distributions, percentages, verified counts, and UGC photo counts.
- [x] **Helpful/Unhelpful Voting**: Adding, switching, and untoggling votes.
- [x] **Vendor Official Replies**: Store reply thread with multi-tenant authorization isolation.
- [x] **Admin Review Moderation**: Spam flagging and automatic exclusion from product rating calculations.
- [x] **Product Q&A Lifecycle**: Asking questions, upvoting questions, official vendor answering, and verified seller badging.
