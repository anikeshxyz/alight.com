-- ==============================================================================
-- Migration: V16__create_returns_and_rma_schema.sql
-- Description: Schema for Return Merchandise Authorization (RMA) & Reverse Logistics
-- ==============================================================================

-- 1. RMA Policy Configuration Table
CREATE TABLE IF NOT EXISTS rma_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    policy_name VARCHAR(150) NOT NULL,
    return_window_days INT NOT NULL DEFAULT 15,
    is_returnable BOOLEAN NOT NULL DEFAULT TRUE,
    restocking_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    allow_refund BOOLEAN NOT NULL DEFAULT TRUE,
    allow_replacement BOOLEAN NOT NULL DEFAULT TRUE,
    allow_store_credit BOOLEAN NOT NULL DEFAULT TRUE,
    terms_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_policies_category ON rma_policies(category_id);
CREATE INDEX IF NOT EXISTS idx_rma_policies_vendor ON rma_policies(vendor_id);

-- 2. Master RMA Requests Table
CREATE TABLE IF NOT EXISTS rma_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_number VARCHAR(60) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    vendor_order_id UUID NOT NULL REFERENCES vendor_orders(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    return_type VARCHAR(50) NOT NULL DEFAULT 'REFUND',
    reason VARCHAR(60) NOT NULL,
    customer_comments TEXT,
    proof_images TEXT,
    vendor_notes TEXT,
    admin_notes TEXT,
    refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    restock_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reverse_awb_number VARCHAR(100),
    reverse_carrier_code VARCHAR(50),
    pickup_scheduled_date TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_requests_number ON rma_requests(rma_number);
CREATE INDEX IF NOT EXISTS idx_rma_requests_order ON rma_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_vendor_order ON rma_requests(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_user ON rma_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_vendor ON rma_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rma_requests_status ON rma_requests(status);

-- 3. RMA Line Items Table
CREATE TABLE IF NOT EXISTS rma_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_id UUID NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    condition_on_return VARCHAR(50),
    restock_action VARCHAR(50),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    inspected_by VARCHAR(100),
    inspection_notes TEXT,
    inspected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_items_rma ON rma_items(rma_id);
CREATE INDEX IF NOT EXISTS idx_rma_items_order_item ON rma_items(order_item_id);

-- 4. RMA Event Audit History Table
CREATE TABLE IF NOT EXISTS rma_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_id UUID NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    actor_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rma_events_rma ON rma_events(rma_id);
CREATE INDEX IF NOT EXISTS idx_rma_events_created ON rma_events(created_at);
