-- V26: Create schema for advanced search, wishlists, product bundles, and personalization
-- Stage 15: Advanced Search & Discovery, Wishlist, Bundles, Personalization Engine

-- ===========================
-- 1. WISHLISTS
-- ===========================
CREATE TABLE IF NOT EXISTS wishlists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL DEFAULT 'My Wishlist',
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (wishlist_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);

-- ===========================
-- 2. PRODUCT BUNDLES
-- ===========================
CREATE TABLE IF NOT EXISTS product_bundles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(300) NOT NULL UNIQUE,
    description     TEXT,
    discount_type   VARCHAR(20) NOT NULL DEFAULT 'PERCENT' CHECK (discount_type IN ('PERCENT', 'FLAT')),
    discount_value  NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    created_by      VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundles_vendor ON product_bundles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bundles_status ON product_bundles(status);

CREATE TABLE IF NOT EXISTS product_bundle_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id   UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (bundle_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON product_bundle_items(product_id);

-- ===========================
-- 3. RECENTLY VIEWED PRODUCTS (Personalization)
-- ===========================
CREATE TABLE IF NOT EXISTS recently_viewed_products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed_products(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON recently_viewed_products(product_id);
