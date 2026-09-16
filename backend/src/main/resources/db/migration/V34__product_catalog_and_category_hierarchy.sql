-- V34: Product Catalog & Multi-Level Category Hierarchy Upgrade
-- Adds category commission overrides, brand featured flag, product tags, HSN codes, and rich variant attributes

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2);

ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tags TEXT,
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
    ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS weight_grams NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON products(hsn_code) WHERE hsn_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(is_featured);
