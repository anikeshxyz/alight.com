-- V40: Logistics, Shipping Calculation, Tracking & Carrier Integration Enhancements

-- 1. Add Return and RTO audit columns to Shipment Packages
ALTER TABLE shipment_packages ADD COLUMN IF NOT EXISTS return_awb_number VARCHAR(100);
ALTER TABLE shipment_packages ADD COLUMN IF NOT EXISTS rto_reason VARCHAR(255);

-- 2. Performance Indexes for Logistics Lookups and Timeline Generation
CREATE INDEX IF NOT EXISTS idx_shipment_packages_vendor_status ON shipment_packages(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_shipment_packages_master_order ON shipment_packages(master_order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_timeline ON shipment_tracking_events(shipment_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_rate_rules_zone_mode ON shipping_rate_rules(zone_tier, shipping_mode);
