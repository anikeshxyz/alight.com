-- V33: Vendor Management & Multi-Tenancy Onboarding Upgrade
-- Extends vendor store configurations, KYC documents, policies, and vacation mode

ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS is_vacation_mode BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS vacation_message VARCHAR(500),
    ADD COLUMN IF NOT EXISTS shipping_policy TEXT,
    ADD COLUMN IF NOT EXISTS refund_policy TEXT,
    ADD COLUMN IF NOT EXISTS privacy_policy TEXT,
    ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
    ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) NOT NULL DEFAULT 'STEP_5_COMPLETED',
    ADD COLUMN IF NOT EXISTS auto_accept_orders BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS minimum_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE vendor_business_details
    ADD COLUMN IF NOT EXISTS business_license_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS tax_certificate_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS id_proof_url VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_vendors_custom_domain ON vendors(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_vacation_mode ON vendors(is_vacation_mode);
