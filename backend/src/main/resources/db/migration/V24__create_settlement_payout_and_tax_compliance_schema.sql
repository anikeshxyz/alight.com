-- V24: Automated Escrow Settlements, Payout Batches & Tax Compliance (TDS/TCS/Commission Invoices)

-- 1. Payout Batches (Grouping multiple vendor payouts for bulk bank processing)
CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_reference VARCHAR(60) NOT NULL UNIQUE,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    payout_count INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, PARTIALLY_FAILED
    bank_batch_id VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_ref ON payout_batches(batch_reference);
CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status);

-- 2. Link Payouts to Batches
ALTER TABLE vendor_payouts ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES payout_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_batch ON vendor_payouts(batch_id);

-- 3. Marketplace Commission Invoices (GST Compliant platform fee bills)
CREATE TABLE IF NOT EXISTS marketplace_commission_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(60) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    gross_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_invoice_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sac_code VARCHAR(20) NOT NULL DEFAULT '998311',
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED', -- ISSUED, PAID, CANCELLED
    invoice_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comm_inv_num ON marketplace_commission_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_comm_inv_vendor ON marketplace_commission_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_comm_inv_period ON marketplace_commission_invoices(period_year, period_month);

-- 4. Tax Compliance Ledgers (TDS Section 194-O, GST TCS Section 52, Commission GST)
CREATE TABLE IF NOT EXISTS tax_compliance_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL, -- e.g. '2025-2026'
    quarter VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
    month INT NOT NULL, -- 1-12
    gross_sales_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    returns_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_taxable_supplies NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tcs_rate NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    tcs_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tds_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.10,
    tds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_gst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_payout_disbursed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'RECONCILED', -- ESTIMATED, RECONCILED, FILED
    vendor_gstin VARCHAR(30),
    vendor_pan VARCHAR(20),
    filed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vendor_tax_period UNIQUE (vendor_id, financial_year, month)
);

CREATE INDEX IF NOT EXISTS idx_tax_ledger_vendor ON tax_compliance_ledgers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tax_ledger_period ON tax_compliance_ledgers(financial_year, quarter);
