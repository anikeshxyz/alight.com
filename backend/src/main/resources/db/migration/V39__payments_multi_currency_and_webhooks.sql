-- V39: Payments, Multi-Currency, Escrow & Webhook Processing Enhancements

-- 1. Webhook logging audit enhancements
ALTER TABLE payment_webhooks ADD COLUMN IF NOT EXISTS signature VARCHAR(255);
ALTER TABLE payment_webhooks ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE payment_webhooks ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE payment_webhooks ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE payment_webhooks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Performance Indexes for Webhooks and Transactions
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_gateway_created ON payment_webhooks(gateway_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway_order ON payment_transactions(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_composite_status ON payment_transactions(order_id, transaction_status);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_pair ON exchange_rate_history(currency_code, recorded_at DESC);
