-- ==============================================================================
-- Migration: V17__seed_returns_demo_data.sql
-- Description: Seed RMA policies, sample return requests, line items, and audit events
-- ==============================================================================

-- 1. RMA Policy Configurations
INSERT INTO rma_policies (
    id, category_id, vendor_id, policy_name, return_window_days,
    is_returnable, restocking_fee_percentage, requires_approval,
    allow_refund, allow_replacement, allow_store_credit, terms_conditions
) VALUES 
(
    '97000000-0000-0000-0000-000000000001', NULL, NULL,
    'Standard Marketplace Return Policy', 15, TRUE, 0.00, TRUE, TRUE, TRUE, TRUE,
    'Standard 15-day return window for unopened and unaltered items in original packaging.'
),
(
    '97000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', NULL,
    'Modular Kitchen Fittings Return Policy', 10, TRUE, 0.00, TRUE, TRUE, TRUE, FALSE,
    'Kitchen pull-outs must be unmounted and returned with complete mounting hardware runners.'
),
(
    '97000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', NULL,
    'Architectural Hardware Extended Policy', 30, TRUE, 5.00, TRUE, TRUE, TRUE, TRUE,
    '30-day extended trial for designer brass hardware. 5% inspection and repackaging fee for unsealed items.'
)
ON CONFLICT DO NOTHING;

-- 2. Demo Seed RMA 1: APPROVED with Scheduled Reverse Pickup
INSERT INTO rma_requests (
    id, rma_number, order_id, vendor_order_id, user_id, vendor_id,
    status, return_type, reason, customer_comments,
    refund_amount, restock_fee, net_refund_amount,
    reverse_awb_number, reverse_carrier_code, pickup_scheduled_date
) VALUES (
    '96000000-0000-0000-0000-000000000001', 'RMA-2026-7001',
    '92000000-0000-0000-0000-000000000001', '99000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
    'PICKUP_SCHEDULED', 'REFUND', 'SIZE_FIT_ISSUE',
    'Handle hole-pitch 160mm was too wide for our existing wardrobe drawer pre-drills. Exchanging for 128mm.',
    1798.00, 0.00, 1798.00,
    'REV-BD-991188IN', 'BLUEDART', NOW() + INTERVAL '1 day'
) ON CONFLICT (rma_number) DO NOTHING;

INSERT INTO rma_items (
    id, rma_id, order_item_id, product_id, variant_id,
    quantity, unit_price, tax_amount, refund_amount, condition_on_return, restock_action
) VALUES (
    '96100000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000001',
    '92100000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', NULL,
    2, 899.00, 323.64, 1798.00, 'UNOPENED', 'RESTOCK_AVAILABLE'
) ON CONFLICT DO NOTHING;

INSERT INTO rma_events (id, rma_id, status, actor_type, actor_id, title, description) VALUES
('96200000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000001', 'REQUESTED', 'CUSTOMER', 'customer@alight.com', 'Return Requested', 'Customer submitted return request for 2 units due to size incompatibility.'),
('96200000-0000-0000-0000-000000000002', '96000000-0000-0000-0000-000000000001', 'APPROVED', 'VENDOR', 'seller@alight.com', 'Return Approved', 'Vendor reviewed and approved return request.'),
('96200000-0000-0000-0000-000000000003', '96000000-0000-0000-0000-000000000001', 'PICKUP_SCHEDULED', 'VENDOR', 'seller@alight.com', 'Reverse Pickup Scheduled', 'Blue Dart Reverse courier booked with AWB REV-BD-991188IN.')
ON CONFLICT DO NOTHING;

-- 3. Demo Seed RMA 2: RECEIVED_AT_WAREHOUSE (Ready for Inspection)
INSERT INTO rma_requests (
    id, rma_number, order_id, vendor_order_id, user_id, vendor_id,
    status, return_type, reason, customer_comments,
    refund_amount, restock_fee, net_refund_amount,
    reverse_awb_number, reverse_carrier_code, received_at
) VALUES (
    '96000000-0000-0000-0000-000000000002', 'RMA-2026-7002',
    '92000000-0000-0000-0000-000000000001', '99000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
    'RECEIVED_AT_WAREHOUSE', 'REFUND', 'DEFECTIVE',
    'Left side soft-close hydraulic damper was leaking fluid upon unpacking.',
    3999.00, 0.00, 3999.00,
    'REV-DEL-772211IN', 'DELHIVERY', NOW() - INTERVAL '2 hours'
) ON CONFLICT (rma_number) DO NOTHING;

INSERT INTO rma_items (
    id, rma_id, order_item_id, product_id, variant_id,
    quantity, unit_price, tax_amount, refund_amount
) VALUES (
    '96100000-0000-0000-0000-000000000002', '96000000-0000-0000-0000-000000000002',
    '92100000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', NULL,
    1, 3999.00, 719.82, 3999.00
) ON CONFLICT DO NOTHING;

INSERT INTO rma_events (id, rma_id, status, actor_type, actor_id, title, description) VALUES
('96200000-0000-0000-0000-000000000004', '96000000-0000-0000-0000-000000000002', 'REQUESTED', 'CUSTOMER', 'customer@alight.com', 'Return Requested', 'Hydraulic fluid leak reported on left runner.'),
('96200000-0000-0000-0000-000000000005', '96000000-0000-0000-0000-000000000002', 'APPROVED', 'VENDOR', 'seller@alight.com', 'Return Approved', 'Approved for immediate replacement/refund verification.'),
('96200000-0000-0000-0000-000000000006', '96000000-0000-0000-0000-000000000002', 'IN_REVERSE_TRANSIT', 'SYSTEM', 'Delhivery Reverse', 'Package picked up by courier', 'Picked up from customer residence.'),
('96200000-0000-0000-0000-000000000007', '96000000-0000-0000-0000-000000000002', 'RECEIVED_AT_WAREHOUSE', 'VENDOR', 'seller@alight.com', 'Delivered at Central Hub', 'Inward delivery completed. Awaiting QA inspection.')
ON CONFLICT DO NOTHING;
