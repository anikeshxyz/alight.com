-- ==========================================================
-- Stage 5: Multi-Warehouse Inventory & Seed Ledger Data
-- ==========================================================

-- 1. Warehouses
INSERT INTO warehouses (id, vendor_id, name, code, contact_name, contact_phone, contact_email, address_line1, city, state, postal_code, country_code, latitude, longitude, is_active, is_primary) VALUES
('90000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Delhi NCR Primary Dispatch Hub', 'WH-DEL-NCR-01', 'Gopal Logistics Dispatcher', '+919876543211', 'dispatch.delhi@alight.com', 'Plot 42, Alight Industrial Park, Sector 58', 'Gurugram', 'Haryana', '122001', 'IN', 28.4595, 77.0266, TRUE, TRUE),
('90000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Mumbai West Coast Logistics Center', 'WH-MUM-WST-02', 'Mahesh Patil', '+919876543214', 'dispatch.mumbai@alight.com', 'Unit 12, Kalher Logistics Park, Bhiwandi', 'Mumbai', 'Maharashtra', '421302', 'IN', 19.2813, 73.0483, TRUE, FALSE),
('90000000-0000-0000-0000-000000000003', NULL, 'Alight Central Platform Fulfillment Center', 'WH-BLR-CTRL-01', 'Platform Operations Lead', '+919876543210', 'ops.bangalore@alight.com', 'Hosur Road Industrial Area, Electronic City Phase 2', 'Bengaluru', 'Karnataka', '560100', 'IN', 12.8399, 77.6770, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Warehouse Stock Allocations for Demo Products

-- Product 1: Modular SS304 Soft-Close Kitchen Pull-Out Basket (Total on-hand: 85)
-- Delhi Hub: 55 units, Mumbai Hub: 30 units
INSERT INTO warehouse_stock (id, warehouse_id, product_id, variant_id, quantity_on_hand, quantity_reserved, reorder_threshold, safety_stock) VALUES
('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', NULL, 55, 0, 10, 5),
('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', NULL, 30, 0, 8, 3),

-- Product 2: Artisan Knurled Solid Brass Cabinet Pull Handle (Total on-hand: 250)
-- Delhi Hub: 150 units, Mumbai Hub: 100 units
('91000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', NULL, 150, 0, 20, 10),
('91000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', NULL, 100, 0, 15, 5),

-- Product 3: Kohler Architectural Towel Bar (Total on-hand: 40)
-- Delhi Hub: 25 units, Mumbai Hub: 15 units
('91000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', NULL, 25, 0, 5, 2),
('91000000-0000-0000-0000-000000000006', '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', NULL, 15, 0, 5, 2),

-- Product 4: Modular Suede Velvet Jewelry Insert (Total on-hand: 60)
-- Delhi Hub: 40 units, Mumbai Hub: 20 units
('91000000-0000-0000-0000-000000000007', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', NULL, 40, 0, 8, 4),
('91000000-0000-0000-0000-000000000008', '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', NULL, 20, 0, 5, 2),

-- Product 5: Hettich LeMans II Corner Carousel (Total on-hand: 15)
-- Delhi Hub: 10 units, Mumbai Hub: 5 units
('91000000-0000-0000-0000-000000000009', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', NULL, 10, 0, 3, 1),
('91000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005', NULL, 5, 0, 2, 1)
ON CONFLICT (warehouse_id, product_id, variant_id) DO NOTHING;

-- 3. Initial Inbound Audit Logs
INSERT INTO inventory_transactions (id, warehouse_id, product_id, variant_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by) VALUES
('95000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', NULL, 'INBOUND_RECEIPT', 55, 0, 55, 'PURCHASE_ORDER', 'PO-DEL-2026-001', 'Initial warehouse stock intake from Hafele manufacturing facility', 'a0000000-0000-0000-0000-000000000002'),
('95000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', NULL, 'INBOUND_RECEIPT', 150, 0, 150, 'PURCHASE_ORDER', 'PO-DEL-2026-002', 'Direct atelier production batch lot #AT-884', 'a0000000-0000-0000-0000-000000000002'),
('95000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', NULL, 'INBOUND_RECEIPT', 10, 0, 10, 'PURCHASE_ORDER', 'PO-DEL-2026-003', 'Imported batch clearance Hettich Germany', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;
