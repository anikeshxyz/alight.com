-- ==========================================================
-- Stage 7: Cart, Orders & RFQ Quote Demo Seed Data
-- ==========================================================

-- 1. Demo Active Cart for Customer (customer@alight.com)
INSERT INTO carts (id, user_id, session_id) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'sess-customer-demo')
ON CONFLICT DO NOTHING;

INSERT INTO cart_items (id, cart_id, product_id, variant_id, vendor_id, quantity) VALUES
('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', NULL, 'b0000000-0000-0000-0000-000000000001', 2),
('c1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', NULL, 'b0000000-0000-0000-0000-000000000001', 10)
ON CONFLICT DO NOTHING;

-- 2. Demo Seed Master Order
INSERT INTO orders (
    id, order_number, user_id, customer_email, customer_name, customer_phone,
    currency_code, total_subtotal, total_tax, total_shipping, total_discount, grand_total,
    order_status, payment_status, payment_method, notes
) VALUES (
    '92000000-0000-0000-0000-000000000001', 'ORD-2026-9041', 'a0000000-0000-0000-0000-000000000004',
    'customer@alight.com', 'Rahul Verma', '+919876543213',
    'INR', 16988.00, 3057.84, 0.00, 1000.00, 16988.00,
    'PROCESSING', 'PAID', 'RAZORPAY', 'Fragile architectural fittings. Please handle with care.'
) ON CONFLICT (order_number) DO NOTHING;

-- Order Shipping Address
INSERT INTO order_addresses (
    id, order_id, address_type, full_name, phone, address_line1, address_line2, city, state, postal_code, country_code
) VALUES (
    'a1000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'SHIPPING',
    'Rahul Verma', '+919876543213', 'Penthouse 14B, Alight Sky Villas', 'Golf Course Road, DLF Phase 5', 'Gurugram', 'Haryana', '122002', 'IN'
) ON CONFLICT DO NOTHING;

-- Vendor Sub-Order
INSERT INTO vendor_orders (
    id, master_order_id, vendor_id, sub_order_number, subtotal, tax_amount, shipping_amount, discount_amount, grand_total,
    fulfillment_status, courier_name, tracking_number
) VALUES (
    '99000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
    'ORD-2026-9041-V1', 16988.00, 3057.84, 0.00, 1000.00, 16988.00,
    'PROCESSING', 'Blue Dart Express', 'BD-99881122IN'
) ON CONFLICT (sub_order_number) DO NOTHING;

-- Order Items
INSERT INTO order_items (
    id, vendor_order_id, product_id, variant_id, product_title, variant_name, sku,
    quantity, unit_price, subtotal, tax_rate, tax_amount, grand_total
) VALUES (
    '92100000-0000-0000-0000-000000000001', '99000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001', NULL,
    'Modular SS304 Soft-Close Kitchen Pull-Out Basket', 'Standard (450mm Cabinet)', 'ALT-KTC-001',
    2, 3999.00, 7998.00, 18.0000, 1439.64, 7998.00
),
(
    '92100000-0000-0000-0000-000000000002', '99000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002', NULL,
    'Artisan Knurled Solid Brass Cabinet Pull Handle', 'Matt Black (160mm Hole Pitch)', 'ALT-HND-002',
    10, 899.00, 8990.00, 18.0000, 1618.20, 8990.00
) ON CONFLICT DO NOTHING;

-- 3. Demo B2B Quote Request
INSERT INTO quote_requests (
    id, quote_number, user_id, vendor_id, status, target_price, offered_price, notes, vendor_notes, expires_at
) VALUES (
    '93000000-0000-0000-0000-000000000001', 'RFQ-2026-104', 'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001', 'OFFERED', 150000.00, 142000.00,
    'Bulk procurement for 50 luxury villa kitchen fit-outs. Delivery needed in Haryana by end of month.',
    'Special wholesale contract approved at â‚¹2,840/unit with freight subsidy included.',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
) ON CONFLICT (quote_number) DO NOTHING;

INSERT INTO quote_items (
    id, quote_id, product_id, variant_id, quantity, requested_unit_price, offered_unit_price
) VALUES (
    '93100000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001', NULL, 50, 3000.00, 2840.00
) ON CONFLICT DO NOTHING;
