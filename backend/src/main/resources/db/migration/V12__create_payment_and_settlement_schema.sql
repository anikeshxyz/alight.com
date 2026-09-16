-- V12: Multi-Gateway Payment Transactions & Vendor Escrow / Wallet Settlement Schema

-- 1. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(60) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gateway_type VARCHAR(30) NOT NULL, -- RAZORPAY, STRIPE, BANK_TRANSFER, MOCK
    transaction_status VARCHAR(30) NOT NULL DEFAULT 'INITIATED', -- INITIATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED
    amount NUMERIC(12, 2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_signature VARCHAR(255),
    payment_method VARCHAR(50), -- UPI, CARD, NETBANKING, WALLET, WIRE
    error_code VARCHAR(100),
    error_message TEXT,
    bank_reference_number VARCHAR(100), -- UTR or Bank Ref for NEFT/RTGS
    receipt_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_ref ON payment_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway_pid ON payment_transactions(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(transaction_status);

-- 2. Payment Webhook Logs (For Idempotency and Audit)
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(120) NOT NULL UNIQUE,
    gateway_type VARCHAR(30) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED', -- PROCESSED, FAILED, IGNORED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON payment_webhooks(event_id);

-- 3. Vendor Wallets (Escrow & Available Payout Balances)
CREATE TABLE IF NOT EXISTS vendor_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
    pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Funds held in Escrow awaiting sub-order delivery
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Cleared funds ready for bank withdrawal
    total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Cumulative lifetime gross sales
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Cumulative lifetime payouts disbursed
    total_commission_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Platform fees deducted
    total_tcs_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- 1% GST TCS tax deducted
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    bank_account_number VARCHAR(60),
    bank_account_holder_name VARCHAR(150),
    bank_ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    is_payout_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_wallets_vendor ON vendor_wallets(vendor_id);

-- 4. Wallet Double-Entry Ledger Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES vendor_wallets(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    vendor_order_id UUID REFERENCES vendor_orders(id) ON DELETE SET NULL,
    payout_id UUID,
    transaction_type VARCHAR(40) NOT NULL, -- ESCROW_HOLD, ESCROW_RELEASE, COMMISSION_DEDUCTION, TCS_DEDUCTION, PAYOUT_DEBIT, REFUND_REVERSAL, ADJUSTMENT
    amount NUMERIC(12, 2) NOT NULL,
    balance_type VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- PENDING, AVAILABLE
    balance_after NUMERIC(12, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_vendor ON wallet_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_vorder ON wallet_transactions(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(transaction_type);

-- 5. Vendor Payout Requests & Disbursements
CREATE TABLE IF NOT EXISTS vendor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_reference VARCHAR(60) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES vendor_wallets(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSING, PAID, REJECTED
    bank_account_number VARCHAR(60) NOT NULL,
    bank_account_holder_name VARCHAR(150) NOT NULL,
    bank_ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    utr_number VARCHAR(100), -- Unique Transaction Reference from Bank
    admin_notes TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payouts_vendor ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_ref ON vendor_payouts(payout_reference);
