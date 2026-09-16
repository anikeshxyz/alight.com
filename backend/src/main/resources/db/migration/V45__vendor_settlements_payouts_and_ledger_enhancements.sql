-- ==========================================================
-- Stage 19: Vendor Settlements, Payouts & Double-Entry Ledger Optimizations
-- ==========================================================

-- 1. Vendor Wallet & Transaction Ledger Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_wallets_vendor_payout 
    ON vendor_wallets(vendor_id, is_payout_enabled);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_type 
    ON wallet_transactions(wallet_id, transaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_vendor_created 
    ON wallet_transactions(vendor_id, created_at DESC);

-- 2. Payout Management Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_status 
    ON vendor_payouts(vendor_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status_requested 
    ON vendor_payouts(status, requested_at DESC);
