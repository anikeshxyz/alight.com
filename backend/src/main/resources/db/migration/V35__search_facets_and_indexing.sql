-- V35: Multi-Faceted Search & Trigram Indexing Upgrade
-- Creates high-performance composite and trigram indexes for product full-text search

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_search_composite 
    ON products(status, category_id, brand_id, base_price);

CREATE INDEX IF NOT EXISTS idx_products_title_trgm 
    ON products USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_tags_trgm 
    ON products USING gin (tags gin_trgm_ops) 
    WHERE tags IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku_trgm 
    ON products USING gin (sku gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_trgm 
    ON categories USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_brands_name_trgm 
    ON brands USING gin (name gin_trgm_ops);
