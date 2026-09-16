-- V41: Returns, Refunds, RMAs & Reverse Logistics Enhancements

-- 1. Add Pickup & Rejection details to RMA Master Requests
ALTER TABLE rma_requests ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30);
ALTER TABLE rma_requests ADD COLUMN IF NOT EXISTS pickup_address_line1 VARCHAR(255);
ALTER TABLE rma_requests ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100);
ALTER TABLE rma_requests ADD COLUMN IF NOT EXISTS pickup_pincode VARCHAR(20);
ALTER TABLE rma_requests ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255);

-- 2. Performance Indexes for RMA Lookups and Filtering
CREATE INDEX IF NOT EXISTS idx_rma_requests_vendor_status ON rma_requests(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_rma_requests_user_created ON rma_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rma_requests_order_vendor ON rma_requests(order_id, vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_rma_events_rma_created ON rma_events(rma_id, created_at DESC);
