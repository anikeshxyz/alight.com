-- V15__seed_logistics_demo_data.sql
-- Seed Shipping Carriers, Pincode Zones, Rate Cards, and Sample Shipment Checkpoints

-- 1. Insert Shipping Carriers
INSERT INTO shipping_carriers (id, carrier_code, carrier_name, api_base_url, tracking_url_template, is_active, priority, supports_cod, supports_express)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'DELHIVERY', 'Delhivery Express', 'https://track.delhivery.com/api', 'https://www.delhivery.com/track/package/{awb}', true, 1, true, true),
    ('c2222222-2222-2222-2222-222222222222', 'BLUE_DART', 'Blue Dart Express', 'https://api.bluedart.com/shipping', 'https://www.bluedart.com/tracking/{awb}', true, 2, true, true),
    ('c3333333-3333-3333-3333-333333333333', 'SHIPROCKET', 'Shiprocket Smart Aggregator', 'https://apiv2.shiprocket.in/v1', 'https://shiprocket.co/tracking/{awb}', true, 3, true, true),
    ('c4444444-4444-4444-4444-444444444444', 'DTDC', 'DTDC Express Courier', 'https://api.dtdc.in/v1', 'https://www.dtdc.in/tracking/shipment-tracking.asp?awbNo={awb}', true, 4, true, false),
    ('c5555555-5555-5555-5555-555555555555', 'MOCK_LOGISTICS', 'Alight HyperLocal Fleet (Mock)', 'http://localhost:8080/api/v1/logistics', '/track?awb={awb}', true, 5, true, true)
ON CONFLICT (carrier_code) DO NOTHING;

-- 2. Insert Pincode Zones & Serviceability Rules
INSERT INTO shipping_pincode_zones (pincode, city, state, zone_tier, is_prepaid_serviceable, is_cod_serviceable, is_express_serviceable, estimated_transit_days, remote_surcharge)
VALUES
    -- Metros
    ('110001', 'New Delhi', 'Delhi', 'METRO', true, true, true, 2, 0.00),
    ('110020', 'South Delhi', 'Delhi', 'METRO', true, true, true, 2, 0.00),
    ('400001', 'Mumbai', 'Maharashtra', 'METRO', true, true, true, 2, 0.00),
    ('400051', 'Bandra Kurla Complex, Mumbai', 'Maharashtra', 'METRO', true, true, true, 2, 0.00),
    ('560001', 'Bengaluru', 'Karnataka', 'METRO', true, true, true, 2, 0.00),
    ('560100', 'Electronic City, Bengaluru', 'Karnataka', 'METRO', true, true, true, 2, 0.00),
    ('600001', 'Chennai', 'Tamil Nadu', 'METRO', true, true, true, 2, 0.00),
    ('700001', 'Kolkata', 'West Bengal', 'METRO', true, true, true, 3, 0.00),
    ('500001', 'Hyderabad', 'Telangana', 'METRO', true, true, true, 2, 0.00),

    -- Tier 1
    ('380001', 'Ahmedabad', 'Gujarat', 'TIER_1', true, true, true, 3, 0.00),
    ('411001', 'Pune', 'Maharashtra', 'TIER_1', true, true, true, 3, 0.00),
    ('302001', 'Jaipur', 'Rajasthan', 'TIER_1', true, true, true, 3, 0.00),
    ('226001', 'Lucknow', 'Uttar Pradesh', 'TIER_1', true, true, true, 3, 0.00),
    ('682001', 'Kochi', 'Kerala', 'TIER_1', true, true, true, 3, 0.00),
    ('452001', 'Indore', 'Madhya Pradesh', 'TIER_1', true, true, true, 3, 0.00),
    ('160001', 'Chandigarh', 'Punjab/Haryana', 'TIER_1', true, true, true, 2, 0.00),

    -- Tier 2
    ('141001', 'Ludhiana', 'Punjab', 'TIER_2', true, true, false, 4, 0.00),
    ('248001', 'Dehradun', 'Uttarakhand', 'TIER_2', true, true, false, 4, 0.00),
    ('800001', 'Patna', 'Bihar', 'TIER_2', true, true, false, 4, 0.00),
    ('751001', 'Bhubaneswar', 'Odisha', 'TIER_2', true, true, false, 4, 0.00),
    ('395001', 'Surat', 'Gujarat', 'TIER_2', true, true, true, 3, 0.00),
    ('834001', 'Ranchi', 'Jharkhand', 'TIER_2', true, true, false, 4, 0.00),

    -- Remote ODA (Out of Delivery Area)
    ('190001', 'Srinagar', 'Jammu & Kashmir', 'REMOTE_ODA', true, false, false, 6, 150.00),
    ('194101', 'Leh', 'Ladakh', 'REMOTE_ODA', true, false, false, 7, 250.00),
    ('795001', 'Imphal', 'Manipur', 'REMOTE_ODA', true, false, false, 6, 200.00),
    ('797001', 'Kohima', 'Nagaland', 'REMOTE_ODA', true, false, false, 6, 200.00),
    ('737101', 'Gangtok', 'Sikkim', 'REMOTE_ODA', true, false, false, 5, 120.00)
ON CONFLICT (pincode) DO NOTHING;

-- 3. Insert Standard & Express Shipping Rate Rules
INSERT INTO shipping_rate_rules (zone_tier, shipping_mode, base_weight_kg, base_rate, incremental_weight_kg, incremental_rate, fuel_surcharge_percent, insurance_fee_percent)
VALUES
    ('METRO', 'STANDARD', 0.50, 45.00, 0.50, 25.00, 5.00, 0.50),
    ('METRO', 'EXPRESS', 0.50, 85.00, 0.50, 45.00, 5.00, 0.50),
    ('TIER_1', 'STANDARD', 0.50, 55.00, 0.50, 30.00, 5.00, 0.50),
    ('TIER_1', 'EXPRESS', 0.50, 110.00, 0.50, 60.00, 5.00, 0.50),
    ('TIER_2', 'STANDARD', 0.50, 70.00, 0.50, 40.00, 6.00, 0.50),
    ('TIER_2', 'EXPRESS', 0.50, 135.00, 0.50, 75.00, 6.00, 0.50),
    ('REMOTE_ODA', 'STANDARD', 0.50, 150.00, 0.50, 90.00, 10.00, 1.00),
    ('REMOTE_ODA', 'EXPRESS', 0.50, 280.00, 0.50, 150.00, 10.00, 1.00);

-- 4. Seed Demo Shipment Packages for Seeded Orders (if matching vendor orders exist)
DO $$
DECLARE
    vo_rec RECORD;
    pkg_id UUID;
    awb_code VARCHAR(100);
BEGIN
    FOR vo_rec IN SELECT vo.id, vo.sub_order_number, vo.master_order_id, vo.vendor_id, vo.created_at, o.order_number 
                  FROM vendor_orders vo 
                  JOIN orders o ON vo.master_order_id = o.id 
                  LIMIT 2 LOOP
        
        awb_code := 'ALIGHT-AWB-' || SUBSTRING(REPLACE(vo_rec.id::text, '-', ''), 1, 10);
        pkg_id := gen_random_uuid();
        
        INSERT INTO shipment_packages (
            id, awb_number, vendor_order_id, master_order_id, vendor_id, carrier_code, carrier_name, 
            status, shipping_mode, package_length_cm, package_width_cm, package_height_cm, 
            dead_weight_kg, volumetric_weight_kg, billed_weight_kg, shipping_cost,
            origin_pincode, origin_city, origin_state, destination_pincode, destination_city, destination_state,
            shipping_label_url, manifest_id, pickup_scheduled_at, picked_up_at, estimated_delivery_at, delivery_confirmation_code
        )
        VALUES (
            pkg_id, awb_code, vo_rec.id, vo_rec.master_order_id, vo_rec.vendor_id, 'DELHIVERY', 'Delhivery Express',
            'IN_TRANSIT', 'STANDARD', 20.00, 15.00, 10.00, 1.20, 0.60, 1.20, 125.00,
            '110001', 'New Delhi', 'Delhi', '400001', 'Mumbai', 'Maharashtra',
            'https://labels.alight.com/' || awb_code || '.pdf', 'MNF-DEL-2026-09',
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', '7842'
        )
        ON CONFLICT (awb_number) DO NOTHING;

        -- Update vendor order tracking number
        UPDATE vendor_orders 
        SET tracking_number = awb_code, courier_name = 'Delhivery Express', fulfillment_status = 'SHIPPED', shipped_at = NOW() - INTERVAL '1 day'
        WHERE id = vo_rec.id;

        -- Insert Tracking Scan Events
        INSERT INTO shipment_tracking_events (shipment_id, event_status, location_hub, city, state, remarks, scanned_by, event_timestamp)
        VALUES
            (pkg_id, 'MANIFESTED', 'North Delhi Sorting Hub', 'New Delhi', 'Delhi', 'Shipping label created & manifestation completed', 'Dispatch Bot', NOW() - INTERVAL '2 days'),
            (pkg_id, 'PICKED_UP', 'Okhla Industrial Center', 'New Delhi', 'Delhi', 'Package picked up from seller warehouse', 'Rider Amit Kumar', NOW() - INTERVAL '1 day 18 hours'),
            (pkg_id, 'REACHED_HUB', 'Delhi Mega Air Hub', 'New Delhi', 'Delhi', 'Package scanned into Delhi sorting facility', 'Inward Scanner #4', NOW() - INTERVAL '1 day 12 hours'),
            (pkg_id, 'IN_TRANSIT', 'Bhiwandi Hub', 'Thane / Mumbai', 'Maharashtra', 'Inter-state line-haul vehicle departed for destination hub', 'Linehaul Fleet 402', NOW() - INTERVAL '6 hours');
            
    END LOOP;
END $$;
