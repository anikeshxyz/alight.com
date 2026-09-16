-- ==========================================================
-- Stage 20: Production Hardening, System Observability & Audit Log Enhancements
-- ==========================================================

-- 1. Security & Audit Trail Indexing
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
    ON audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created 
    ON audit_logs(resource, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created 
    ON audit_logs(actor_email, created_at DESC);

-- 2. System Verification Metadata
COMMENT ON TABLE users IS 'Production user accounts with Argon2 password hashing and MFA support';
COMMENT ON TABLE vendors IS 'Multi-tenant vendor organizations with KYC validation';
COMMENT ON TABLE products IS 'Global product catalog with variant matrix and pricing';
COMMENT ON TABLE orders IS 'Master and sub-order fulfillment records';
COMMENT ON TABLE payment_transactions IS 'Multi-gateway idempotent payment transactions';
COMMENT ON TABLE vendor_wallets IS 'Escrow and settled balance accounting ledger';
