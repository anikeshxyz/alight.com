-- V27: Seed demo data for wishlists, product bundles, and recently viewed
-- Stage 15: Advanced Search & Discovery, Wishlist, Bundles, Personalization Engine

-- ===========================
-- 1. Seed Wishlists for Demo Customer
-- ===========================
INSERT INTO wishlists (id, user_id, name, is_public) VALUES
('f1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Kitchen Renovation Project', FALSE),
('f1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Bathroom Upgrade', TRUE)
ON CONFLICT DO NOTHING;

-- Seed Wishlist Items
INSERT INTO wishlist_items (wishlist_id, product_id) VALUES
('f1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
('f1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002'),
('f1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005'),
('f1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003'),
('f1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- ===========================
-- 2. Seed Product Bundles
-- ===========================
INSERT INTO product_bundles (id, vendor_id, title, slug, description, discount_type, discount_value, status, created_by) VALUES
('f2000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'Complete Kitchen Organization Bundle',
 'complete-kitchen-organization-bundle',
 'Transform your kitchen with our curated combo: premium soft-close pull-out basket plus the iconic LeMans II corner carousel. Save 12% versus buying separately â€” everything you need for a fully organized, silent, and professional kitchen interior.',
 'PERCENT',
 12.00,
 'ACTIVE',
 'admin@alight.com'),

('f2000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000001',
 'Luxury Bathroom & Wardrobe Essentials',
 'luxury-bathroom-wardrobe-essentials',
 'Elevate your personal spaces with our signature pairing: the Kohler matte black double towel bar and our handcrafted suede velvet wardrobe jewelry organizer. A â‚¹1,440 combined saving on two of our most celebrated lifestyle products.',
 'FLAT',
 1440.00,
 'ACTIVE',
 'admin@alight.com')
ON CONFLICT (slug) DO NOTHING;

-- Bundle Items
INSERT INTO product_bundle_items (bundle_id, product_id, quantity) VALUES
-- Kitchen Bundle
('f2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1),
('f2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 1),
-- Bathroom & Wardrobe Bundle
('f2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 1),
('f2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 1)
ON CONFLICT DO NOTHING;

-- ===========================
-- 3. Seed Recently Viewed for Demo Customer
-- ===========================
INSERT INTO recently_viewed_products (user_id, product_id, viewed_at) VALUES
('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour'),
('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes')
ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = EXCLUDED.viewed_at;
