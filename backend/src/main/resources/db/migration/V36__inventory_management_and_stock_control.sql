-- V36: Inventory Management & Stock Control Upgrade
-- Adds high-performance indexes for warehouse stock, reservations, and inventory transaction auditing

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_lookup 
    ON warehouse_stock(warehouse_id, product_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_token 
    ON stock_reservations(reservation_token);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_cleanup 
    ON stock_reservations(status, expires_at) 
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_inventory_tx_audit 
    ON inventory_transactions(warehouse_id, product_id, created_at DESC);
