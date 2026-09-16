-- V14__create_logistics_and_shipping_schema.sql
-- Logistics, Multi-Carrier Integrations, Pincode Serviceability & Shipment Tracking Schema

CREATE TABLE shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_code VARCHAR(50) NOT NULL UNIQUE,
    carrier_name VARCHAR(100) NOT NULL,
    api_base_url VARCHAR(255),
    tracking_url_template VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 1,
    supports_cod BOOLEAN NOT NULL DEFAULT true,
    supports_express BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_pincode_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zone_tier VARCHAR(50) NOT NULL DEFAULT 'TIER_1', -- 'METRO', 'TIER_1', 'TIER_2', 'REMOTE_ODA'
    is_prepaid_serviceable BOOLEAN NOT NULL DEFAULT true,
    is_cod_serviceable BOOLEAN NOT NULL DEFAULT true,
    is_express_serviceable BOOLEAN NOT NULL DEFAULT true,
    estimated_transit_days INT NOT NULL DEFAULT 3,
    remote_surcharge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pincode_lookup ON shipping_pincode_zones(pincode);

CREATE TABLE shipping_rate_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_tier VARCHAR(50) NOT NULL, -- 'LOCAL', 'METRO', 'TIER_1', 'TIER_2', 'REMOTE_ODA'
    shipping_mode VARCHAR(50) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD', 'EXPRESS'
    base_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.50,
    base_rate NUMERIC(10, 2) NOT NULL DEFAULT 40.00,
    incremental_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.50,
    incremental_rate NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    fuel_surcharge_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    insurance_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE shipment_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awb_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_order_id UUID NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,
    master_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    carrier_code VARCHAR(50) NOT NULL,
    carrier_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'MANIFESTED', -- 'MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_INITIATED', 'RTO_DELIVERED', 'CANCELLED'
    shipping_mode VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    
    -- Dimensions & Weight
    package_length_cm NUMERIC(6, 2) NOT NULL DEFAULT 15.00,
    package_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    package_height_cm NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    dead_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.50,
    volumetric_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.15,
    billed_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.50,
    
    -- Costs
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Routing
    origin_pincode VARCHAR(10) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(100) NOT NULL,
    destination_pincode VARCHAR(10) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_state VARCHAR(100) NOT NULL,
    
    -- Logistics Metadata
    shipping_label_url VARCHAR(500),
    manifest_id VARCHAR(100),
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_confirmation_code VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_awb ON shipment_packages(awb_number);
CREATE INDEX idx_shipments_vendor_order ON shipment_packages(vendor_order_id);
CREATE INDEX idx_shipments_master_order ON shipment_packages(master_order_id);
CREATE INDEX idx_shipments_status ON shipment_packages(status);

CREATE TABLE shipment_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipment_packages(id) ON DELETE CASCADE,
    event_status VARCHAR(50) NOT NULL,
    location_hub VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    remarks VARCHAR(500),
    scanned_by VARCHAR(100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_shipment ON shipment_tracking_events(shipment_id);
CREATE INDEX idx_tracking_timestamp ON shipment_tracking_events(event_timestamp);
