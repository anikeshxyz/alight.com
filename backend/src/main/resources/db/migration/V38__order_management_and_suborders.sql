-- V38: Order Management System (OMS) & Multi-Vendor Sub-Orders Enhancements

-- 1. Add Commission, Payout, and Notes fields to Vendor Orders
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Performance indexes for Order Lookups and Filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor_status ON vendor_orders(vendor_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_master_order ON vendor_orders(master_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_order ON order_items(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant ON order_items(product_id, variant_id);
