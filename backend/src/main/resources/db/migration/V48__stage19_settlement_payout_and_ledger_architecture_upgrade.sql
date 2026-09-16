-- ==============================================================================
-- Migration: V48__stage19_settlement_payout_and_ledger_architecture_upgrade.sql
-- Description: Stage 19 Enterprise Upgrade - Decoupled Settlements, Policies, Rate Cards,
--              Order Item Granularity, Post-Settlement Recovery, True Double-Entry Ledger,
--              Reconciliation Engine & Backfill.
-- ==============================================================================

-- 1. Settlement Policies (Configurable return windows & cooling periods)
CREATE TABLE IF NOT EXISTS settlement_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(150) NOT NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'MARKETPLACE_DEFAULT', -- MARKETPLACE_DEFAULT, CATEGORY, VENDOR, PRODUCT
    scope_id UUID,
    return_window_days INT NOT NULL DEFAULT 7,
    auto_approval_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    hold_disputed_orders BOOLEAN NOT NULL DEFAULT TRUE,
    cooling_period_hours INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_policy_scope ON settlement_policies(scope, scope_id);

-- 2. Settlement Rate Cards (Dynamic configurable commission & fees)
CREATE TABLE IF NOT EXISTS settlement_rate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_card_code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    logistics_fee_fixed NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_gateway_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    marketplace_fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_rc_code ON settlement_rate_cards(rate_card_code);
CREATE INDEX IF NOT EXISTS idx_settle_rc_vendor ON settlement_rate_cards(vendor_id);
CREATE INDEX IF NOT EXISTS idx_settle_rc_category ON settlement_rate_cards(category_id);

-- 3. Settlement Tax Rules (Configurable statutory tax withholding)
CREATE TABLE IF NOT EXISTS settlement_tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_rule_code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    jurisdiction VARCHAR(50) NOT NULL DEFAULT 'IN',
    tax_type VARCHAR(50) NOT NULL DEFAULT 'GST_TCS', -- GST_TCS, TDS_194O, VAT, SALES_TAX
    rate_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    calculation_base VARCHAR(50) NOT NULL DEFAULT 'NET_TAXABLE_SUPPLIES',
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_tr_code ON settlement_tax_rules(tax_rule_code);

-- 4. Settlements Entity (First-class Domain Concept)
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number VARCHAR(60) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    master_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    vendor_order_id UUID NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, CALCULATED, ELIGIBILITY_EVALUATION, ELIGIBLE, ON_HOLD, APPROVED, SETTLED, REVERSED, ADJUSTED, DISPUTED
    hold_reason TEXT,
    gross_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    shipping_credit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    seller_credits NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    platform_commission NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    logistics_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_fee_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    marketplace_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_withholding_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    refund_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    adjustment_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_payable_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    rate_card_id UUID REFERENCES settlement_rate_cards(id),
    rate_card_version VARCHAR(20),
    tax_rule_id UUID REFERENCES settlement_tax_rules(id),
    tax_rule_version VARCHAR(20),
    eligible_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    calculation_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settlements_vendor ON settlements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_settlements_vorder ON settlements(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_eligible_at ON settlements(eligible_at);

-- 5. Settlement Items (Order Item Level Financial Granularity)
CREATE TABLE IF NOT EXISTS settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    gross_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING', -- PENDING, ELIGIBLE, SETTLED, RETURNED, REFUNDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_items_settlement ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settle_items_order_item ON settlement_items(order_item_id);

-- 6. Settlement Adjustments & Post-Settlement Returns
CREATE TABLE IF NOT EXISTS settlement_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number VARCHAR(60) NOT NULL UNIQUE,
    settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    rma_id UUID REFERENCES rma_requests(id) ON DELETE SET NULL,
    adjustment_type VARCHAR(50) NOT NULL, -- RETURN_REFUND, CHARGEBACK, PENALTY, REVERSAL, MANUAL_ADMIN, CORRECTION
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    created_by VARCHAR(150),
    status VARCHAR(40) NOT NULL DEFAULT 'APPLIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_adj_vendor ON settlement_adjustments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_settle_adj_settlement ON settlement_adjustments(settlement_id);

-- 7. Vendor Debt Recovery (Negative Balance & Clawback Engine)
CREATE TABLE IF NOT EXISTS vendor_debt_recoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_reference VARCHAR(60) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    adjustment_id UUID REFERENCES settlement_adjustments(id) ON DELETE SET NULL,
    original_amount NUMERIC(12,2) NOT NULL,
    recovered_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'RECOVERY_PENDING', -- RECOVERY_PENDING, RECOVERY_PARTIAL, RECOVERY_COMPLETED, RECOVERY_FAILED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vdebt_vendor_status ON vendor_debt_recoveries(vendor_id, status);

-- 8. Reconciliation Records (Ledger vs Gateway vs Bank)
CREATE TABLE IF NOT EXISTS reconciliation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_reference VARCHAR(60) NOT NULL UNIQUE,
    reconciliation_type VARCHAR(50) NOT NULL, -- GATEWAY_ESCROW, BANK_PAYOUT, LEDGER_AUDIT
    external_reference VARCHAR(120),
    ledger_reference VARCHAR(120),
    expected_amount NUMERIC(14,2) NOT NULL,
    actual_amount NUMERIC(14,2) NOT NULL,
    difference_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(40) NOT NULL DEFAULT 'MATCHED', -- MATCHED, PARTIALLY_MATCHED, MISMATCH, MISSING_PROVIDER, MISSING_LEDGER
    discrepancy_reason TEXT,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reconciled_by VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_recon_ref ON reconciliation_records(record_reference);
CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_records(status);

-- 9. Extend Vendor Wallets with Enterprise Balances
ALTER TABLE vendor_wallets ADD COLUMN IF NOT EXISTS reserved_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE vendor_wallets ADD COLUMN IF NOT EXISTS on_hold_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE vendor_wallets ADD COLUMN IF NOT EXISTS recovery_due_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00;

-- 10. Extend Wallet Transactions for True Double-Entry & Idempotency
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tx_idempotency ON wallet_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_tx_settlement ON wallet_transactions(settlement_id);

-- 11. Extend Vendor Payouts with Provider Abstraction & Idempotency
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER';
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(100);
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payout_idempotency ON vendor_payouts(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 12. Seed Default Policy, Rate Card & Tax Rule
INSERT INTO settlement_policies (policy_name, scope, return_window_days, auto_approval_enabled, hold_disputed_orders)
VALUES ('Marketplace Standard Policy (7-Day Return Window)', 'MARKETPLACE_DEFAULT', 7, TRUE, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO settlement_rate_cards (rate_card_code, name, commission_rate, logistics_fee_fixed, payment_gateway_fee_percent, marketplace_fixed_fee, version)
VALUES ('RC-DEFAULT', 'Standard Marketplace Rate Card', 10.00, 0.00, 0.00, 0.00, 'v1.0')
ON CONFLICT (rate_card_code) DO NOTHING;

INSERT INTO settlement_tax_rules (tax_rule_code, name, jurisdiction, tax_type, rate_percentage, calculation_base, version)
VALUES ('TAX-GST-TCS-01', 'Section 52 CGST Act - GST TCS (1%)', 'IN', 'GST_TCS', 1.00, 'NET_TAXABLE_SUPPLIES', 'v1.0')
ON CONFLICT (tax_rule_code) DO NOTHING;

-- 13. Backfill Existing Delivered Sub-Orders into Settlements (Preserving historical continuity)
DO $$
DECLARE
    vo RECORD;
    rc_id UUID;
    tr_id UUID;
    gross NUMERIC;
    comm NUMERIC;
    tcs NUMERIC;
    net NUMERIC;
    settle_num VARCHAR;
BEGIN
    SELECT id INTO rc_id FROM settlement_rate_cards WHERE rate_card_code = 'RC-DEFAULT' LIMIT 1;
    SELECT id INTO tr_id FROM settlement_tax_rules WHERE tax_rule_code = 'TAX-GST-TCS-01' LIMIT 1;

    FOR vo IN 
        SELECT v.*, ven.commission_percentage 
        FROM vendor_orders v
        JOIN vendors ven ON v.vendor_id = ven.id
        WHERE v.fulfillment_status = 'DELIVERED'
    LOOP
        gross := COALESCE(vo.grand_total, vo.subtotal, 0.00);
        comm := ROUND((COALESCE(vo.subtotal, gross) * COALESCE(vo.commission_percentage, 10.00) / 100.00), 2);
        tcs := ROUND((COALESCE(vo.subtotal, gross) * 0.01), 2);
        net := gross - comm - tcs;
        IF net < 0 THEN net := 0; END IF;

        settle_num := 'SET-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY') || '-' || UPPER(SUBSTRING(vo.id::text, 1, 8));

        INSERT INTO settlements (
            settlement_number, vendor_id, master_order_id, vendor_order_id, status,
            gross_amount, platform_commission, tax_withholding_amount, net_payable_amount,
            currency_code, rate_card_id, rate_card_version, tax_rule_id, tax_rule_version,
            eligible_at, approved_at, settled_at
        ) VALUES (
            settle_num, vo.vendor_id, vo.master_order_id, vo.id, 'SETTLED',
            gross, comm, tcs, net,
            'INR', rc_id, 'v1.0', tr_id, 'v1.0',
            COALESCE(vo.delivered_at, vo.created_at),
            COALESCE(vo.delivered_at, vo.created_at),
            COALESCE(vo.delivered_at, vo.created_at)
        ) ON CONFLICT (settlement_number) DO NOTHING;
    END LOOP;
END $$;
