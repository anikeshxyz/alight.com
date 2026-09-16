-- ==========================================================
-- Stage 2: Production-Grade ERD Optimizations, Triggers & Search Indexing
-- Alight International Multi-Vendor Marketplace
-- ==========================================================

-- 1. Enable Required High-Performance PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Version Columns for Optimistic Concurrency Control
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE vendor_wallets ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Automatic updated_at Timestamp Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Timestamp Triggers to Tables with updated_at Column
DO $$
DECLARE
    t text;
    tbls text[] := ARRAY[
        'users', 'user_addresses', 'vendors', 'vendor_business_details',
        'vendor_pickup_addresses', 'vendor_bank_accounts', 'categories', 'brands',
        'products', 'product_variants', 'warehouses', 'warehouse_stock',
        'currencies', 'currency_exchange_rates', 'tax_categories', 'tax_jurisdictions',
        'tax_rules', 'tax_rate_components', 'product_tier_prices', 'carts',
        'cart_items', 'orders', 'vendor_orders', 'payment_transactions',
        'vendor_wallets', 'shipping_carriers', 'shipping_pincode_zones',
        'shipping_rate_rules', 'shipment_packages', 'rma_requests', 'rma_policies',
        'coupons', 'promotion_rules', 'flash_sales', 'product_reviews',
        'product_questions', 'product_answers', 'support_tickets',
        'notification_templates', 'notifications', 'marketplace_commission_invoices',
        'tax_compliance_ledgers', 'settlement_cycles', 'vendor_payouts',
        'payout_batches', 'wishlists', 'product_bundles', 'quote_requests'
    ];
BEGIN
    FOREACH t IN ARRAY tbls LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', t);
            EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();', t);
        END IF;
    END LOOP;
END $$;

-- 5. Trigram GIN Search Indexes for Blazing-Fast Autocomplete & Multi-Vendor Search
CREATE INDEX IF NOT EXISTS idx_products_trgm_title ON products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_trgm_sku ON products USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_trgm_short_desc ON products USING gin (short_description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_trgm_store_name ON vendors USING gin (store_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_trgm_name ON categories USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_trgm_name ON brands USING gin (name gin_trgm_ops);

-- 6. High-Performance Composite & Partial Indexes
-- Products & Catalog
CREATE INDEX IF NOT EXISTS idx_products_category_status_price ON products (category_id, status, base_price);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_products_active_rating ON products (status, average_rating DESC) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_variants_product_active ON product_variants (product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_images_product_display ON product_images (product_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_attributes_product_display ON product_attributes (product_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_tier_prices_product_qty ON product_tier_prices (product_id, min_quantity ASC);

-- Inventory & Stock
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_lookup ON warehouse_stock (warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_variant ON warehouse_stock (warehouse_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status_expiry ON stock_reservations (status, expires_at);

-- Orders & Multi-Vendor Sub-Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders (customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor_status ON vendor_orders (vendor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_order ON order_items (vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_order_status ON payment_transactions (order_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created ON wallet_transactions (wallet_id, created_at DESC);

-- Logistics & Shipments
CREATE INDEX IF NOT EXISTS idx_shipment_vendor_order ON shipment_packages (vendor_order_id, status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_package ON shipment_tracking_events (package_id, event_time DESC);

-- RMA & Returns
CREATE INDEX IF NOT EXISTS idx_rma_customer_status ON rma_requests (customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rma_vendor_status ON rma_requests (vendor_id, status, created_at DESC);

-- Reviews & QA
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON product_reviews (product_id, is_approved, rating DESC);
CREATE INDEX IF NOT EXISTS idx_questions_product_approved ON product_questions (product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_answers_question_approved ON product_answers (question_id, is_approved);

-- Support & Notifications
CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON support_tickets (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON support_tickets (assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);

-- Settlements & Invoices
CREATE INDEX IF NOT EXISTS idx_payouts_vendor_status ON vendor_payouts (vendor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_vendor_date ON marketplace_commission_invoices (vendor_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_ledger_vendor_period ON tax_compliance_ledgers (vendor_id, tax_period);

-- Personalization, Wishlist & Quotes
CREATE INDEX IF NOT EXISTS idx_wishlist_items_lookup ON wishlist_items (wishlist_id, product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_viewed ON recently_viewed_products (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_status ON quote_requests (customer_id, status, created_at DESC);

-- 7. Update System Metadata
INSERT INTO system_metadata (key, value, updated_at)
VALUES ('schema_stage', 'STAGE_2_PRODUCTION_READY', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
