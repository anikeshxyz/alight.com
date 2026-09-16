-- V13: Seed Initial Vendor Wallets & Bank Details for Demo Vendors

-- Initialize Vendor Wallets for existing approved vendors
INSERT INTO vendor_wallets (
    id,
    vendor_id,
    pending_balance,
    available_balance,
    total_earnings,
    total_withdrawn,
    total_commission_paid,
    total_tcs_paid,
    currency_code,
    bank_account_number,
    bank_account_holder_name,
    bank_ifsc_code,
    bank_name,
    bank_branch,
    is_payout_enabled
)
SELECT 
    gen_random_uuid(),
    v.id,
    18450.00, -- Sample pending escrow balance
    64200.00, -- Sample available payout balance
    95000.00, -- Sample lifetime earnings
    10000.00, -- Sample previous withdrawals
    7600.00,  -- Sample commissions paid
    950.00,   -- Sample TCS paid (1%)
    'INR',
    '987654321098',
    v.store_name || ' Pvt Ltd',
    'HDFC0001234',
    'HDFC Bank',
    'Nariman Point Branch, Mumbai',
    TRUE
FROM vendors v
ON CONFLICT (vendor_id) DO NOTHING;

-- Seed Sample Wallet Transactions
INSERT INTO wallet_transactions (
    id,
    wallet_id,
    vendor_id,
    transaction_type,
    amount,
    balance_type,
    balance_after,
    description,
    reference_id,
    created_at
)
SELECT
    gen_random_uuid(),
    vw.id,
    vw.vendor_id,
    'ESCROW_RELEASE',
    64200.00,
    'AVAILABLE',
    64200.00,
    'Escrow balance released upon sub-order delivery ORD-2026-DEMO1-V1',
    'ORD-2026-DEMO1-V1',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM vendor_wallets vw
LIMIT 1;

-- Seed Sample Completed Payout
INSERT INTO vendor_payouts (
    id,
    payout_reference,
    vendor_id,
    wallet_id,
    amount,
    currency_code,
    status,
    bank_account_number,
    bank_account_holder_name,
    bank_ifsc_code,
    bank_name,
    utr_number,
    admin_notes,
    requested_at,
    approved_at,
    processed_at
)
SELECT
    gen_random_uuid(),
    'PAY-2026-00001',
    vw.vendor_id,
    vw.id,
    10000.00,
    'INR',
    'PAID',
    vw.bank_account_number,
    vw.bank_account_holder_name,
    vw.bank_ifsc_code,
    vw.bank_name,
    'HDFCN26081234567',
    'Weekly automated settlement approved by Finance Desk',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '9 days',
    CURRENT_TIMESTAMP - INTERVAL '9 days'
FROM vendor_wallets vw
LIMIT 1;
