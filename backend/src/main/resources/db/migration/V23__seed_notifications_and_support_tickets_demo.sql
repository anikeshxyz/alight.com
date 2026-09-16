-- ==========================================================
-- Stage 13: Seed Notifications & Support Tickets Demo Data
-- ==========================================================

-- 1. Seed In-App Notifications for Demo Users
INSERT INTO notifications (
    id, user_id, title, message, type, channel, reference_id, action_url, is_read, created_at
) VALUES
-- For Customer (Rahul Verma)
(
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'Order Dispatched #ORD-2026-90412',
    'Your order containing Modular SS304 Kitchen Basket has been picked up by Delhivery (AWB: DEL-918273645).',
    'ORDER_SHIPPED',
    'IN_APP',
    'ORD-2026-90412',
    '/track?awb=DEL-918273645',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'Vendor Replied to Your Review',
    'Alight Hardware Atelier replied to your verified review on Artisan Knurled Brass Handle.',
    'REVIEW_ACTIVITY',
    'IN_APP',
    'e0000000-0000-0000-0000-000000000002',
    '/products/artisan-knurled-solid-brass-cabinet-pull-handle',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'Festival Offer: 15% OFF Architectural Hardware',
    'Use voucher code WELCOME10 or DORMA15 for instant discounts on premium German fittings.',
    'PROMOTION',
    'IN_APP',
    'PROMO-FESTIVAL',
    '/products',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
-- For Vendor (Vikram Sharma / Alight Hardware Atelier)
(
    '10000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'New Customer Inquiry on Spice Rack',
    'A customer asked a question regarding internal carcass dimensions on Modular SS304 Kitchen Basket.',
    'REVIEW_ACTIVITY',
    'IN_APP',
    'e0000000-0000-0000-0000-000000000001',
    '/vendor/reviews',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
(
    '10000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    'Support Ticket Assigned #TCK-2026-00101',
    'New customer inquiry regarding installation template instructions has been linked to your store.',
    'TICKET_MESSAGE',
    'IN_APP',
    'TCK-2026-00101',
    '/vendor/support',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
),
-- For Admin (Alight Admin)
(
    '10000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Support Ticket Escalated: #TCK-2026-00102',
    'Customer Rahul Verma submitted a high-priority ticket regarding B2B bulk quotation discrepancy.',
    'TICKET_MESSAGE',
    'IN_APP',
    'TCK-2026-00102',
    '/admin/support',
    FALSE,
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Support Tickets
INSERT INTO support_tickets (
    id, ticket_number, user_id, vendor_id, category, subject, status, priority, assigned_to, created_at
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'TCK-2026-00101',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'PRODUCT_INQUIRY',
    'Need architectural CAD DWG file and carcass drilling template for SS304 Wire Baskets',
    'IN_PROGRESS',
    'MEDIUM',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '20000000-0000-0000-0000-000000000002',
    'TCK-2026-00102',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'ORDER_ISSUE',
    'Urgent B2B wholesale order delivery timeline verification for residential project',
    'OPEN',
    'HIGH',
    'a0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
)
ON CONFLICT (ticket_number) DO NOTHING;

-- 3. Seed Ticket Messages (Threaded history)
INSERT INTO ticket_messages (
    id, ticket_id, sender_id, sender_type, sender_name, message_text, is_internal_note, attachments, created_at
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'CUSTOMER',
    'Rahul Verma (Customer)',
    'Hello Support, our interior carpentry team is planning the cabinet millwork layout. Could you please share the 1:1 scale drilling template and CAD drawing for the 2-tier Modular SS304 Kitchen Basket?',
    FALSE,
    '[]'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'VENDOR',
    'Alight Hardware Atelier (Vendor)',
    'Hi Rahul, thank you for reaching out! We have uploaded the high-resolution PDF template and standard 32mm system boring specifications directly to our product specs sheet.',
    FALSE,
    '["https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '18 hours'
),
(
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'ADMIN',
    'Alight Marketplace Support',
    'Verified with vendor engineering team. Ticket moved to IN_PROGRESS. Customer notified.',
    TRUE,
    '[]'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
),
(
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'CUSTOMER',
    'Rahul Verma (Customer)',
    'We are placing a 50-unit wholesale batch for a luxury apartment project in Gurugram. Please confirm if express surface freight can deliver by next Friday.',
    FALSE,
    '[]'::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
)
ON CONFLICT (id) DO NOTHING;
