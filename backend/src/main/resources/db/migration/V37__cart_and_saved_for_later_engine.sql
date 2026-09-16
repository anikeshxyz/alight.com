-- V37: Shopping Cart & Saved-For-Later Engine Upgrade
-- Adds saved-for-later support, price tracking at addition, and cart lookup indexes

ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS is_saved_for_later BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS price_at_addition NUMERIC(12, 2);

CREATE INDEX IF NOT EXISTS idx_cart_items_saved 
    ON cart_items(cart_id, is_saved_for_later);

CREATE INDEX IF NOT EXISTS idx_carts_user_session 
    ON carts(user_id, session_id);
