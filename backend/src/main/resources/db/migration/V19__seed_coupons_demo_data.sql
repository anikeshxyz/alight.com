-- ==============================================================================
-- Migration: V19__seed_coupons_demo_data.sql
-- Description: Seed initial marketplace coupons, vendor discounts, and promotion banners
-- ==============================================================================

-- 1. Demo Coupons
INSERT INTO coupons (
    id, code, title, description, discount_type, discount_value,
    max_discount_amount, min_order_amount, usage_limit_total,
    usage_limit_per_user, total_used_count, valid_from, valid_until,
    is_active, scope, vendor_id, category_id, created_by
) VALUES 
(
    '98000000-0000-0000-0000-000000000001', 'WELCOME10', 'First Order Welcome Privilege',
    'Enjoy 10% discount on your initial luxury architectural fittings order (up to â‚¹1,500 off).',
    'PERCENTAGE', 10.00, 1500.00, 1000.00, 5000, 1, 14,
    NOW() - INTERVAL '30 days', NOW() + INTERVAL '365 days',
    TRUE, 'FIRST_ORDER', NULL, NULL, 'admin@alight.com'
),
(
    '98000000-0000-0000-0000-000000000002', 'ARCHFEST20', 'Architectural Hardware Festival',
    'Special 20% discount on all solid brass handles, hinges, and lock sets (up to â‚¹3,000 off).',
    'PERCENTAGE', 20.00, 3000.00, 3000.00, 1000, 2, 42,
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days',
    TRUE, 'CATEGORY', NULL, 'c0000000-0000-0000-0000-000000000004', 'admin@alight.com'
),
(
    '98000000-0000-0000-0000-000000000003', 'FREESHIP', 'Complimentary Express Logistics',
    'Free nationwide insured freight shipping on architectural hardware orders above â‚¹2,500.',
    'FREE_SHIPPING', 0.00, NULL, 2500.00, 10000, 5, 88,
    NOW() - INTERVAL '15 days', NOW() + INTERVAL '180 days',
    TRUE, 'GLOBAL', NULL, NULL, 'admin@alight.com'
),
(
    '98000000-0000-0000-0000-000000000004', 'ATELIER500', 'Alight Atelier Signature Voucher',
    'Flat â‚¹500 instant discount on all precision German-engineered modular kitchen accessories.',
    'FIXED_AMOUNT', 500.00, NULL, 3500.00, 500, 1, 23,
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days',
    TRUE, 'VENDOR', 'b0000000-0000-0000-0000-000000000001', NULL, 'seller@alight.com'
)
ON CONFLICT (code) DO NOTHING;

-- 2. Demo Seed Promotion Banners
INSERT INTO promotions (
    id, title, slug, banner_image_url, banner_tag, badge_text, discount_text,
    target_url, start_time, end_time, is_active, display_order
) VALUES 
(
    '97100000-0000-0000-0000-000000000001',
    'German Precision Modular Kitchen Fit-Outs',
    'german-precision-kitchen-fitouts',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    'SUMMER REFRESH', 'UP TO 20% OFF', 'Use Code: ARCHFEST20',
    '/products?category=kitchen-accessories',
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days',
    TRUE, 1
),
(
    '97100000-0000-0000-0000-000000000002',
    'Solid Forged Architectural Brass Collection',
    'solid-forged-brass-collection',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    'BESPOKE LUXURY', 'SPECIAL LAUNCH', 'Flat â‚¹500 Off with ATELIER500',
    '/products?category=architectural-hardware',
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days',
    TRUE, 2
)
ON CONFLICT (slug) DO NOTHING;
