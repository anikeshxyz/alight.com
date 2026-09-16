-- ==========================================================
-- Stage 2: Database / ERD & Catalog Refinement Migration
-- ==========================================================

-- 1. Additional Demo Users for Vendor Profiles
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified) VALUES
('a0000000-0000-0000-0000-000000000005', 'alight.store@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Alight', 'Flagship Store', '+919876543214', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000006', 'heritage.brass@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Devendra', 'Singhal', '+919876543215', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000007', 'apex.budget@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Rajesh', 'Goel', '+919876543216', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM roles WHERE name IN ('ROLE_VENDOR', 'ROLE_CUSTOMER')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000006', id FROM roles WHERE name = 'ROLE_CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000007', id FROM roles WHERE name = 'ROLE_CUSTOMER'
ON CONFLICT DO NOTHING;

-- 2. Multi-Vendor Diversity (First-Party Flagship, Approved, Pending, and Rejected)
INSERT INTO vendors (id, user_id, store_name, slug, description, support_email, support_phone, commission_percentage, status) VALUES
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'Alight International Official Store', 'alight-international-official-store', 'Official first-party manufacturer flagship store providing factory-certified SS304 modular kitchen hardware and luxury architectural fittings with 10-year replacement warranty.', 'flagship@alight.com', '+919876543214', 0.00, 'APPROVED'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'Heritage Brass Works', 'heritage-brass-works', 'Artisanal hand-forged sand-cast brass hardware, mortise entry locks, and traditional Indian haveli architectural fittings.', 'contact@heritagebrass.com', '+919876543215', 12.00, 'PENDING_VERIFICATION'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000007', 'Apex Budget Hardware', 'apex-budget-hardware', 'Economy grade zinc alloy cabinet handles and budget drawer channels.', 'info@apexbudget.com', '+919876543216', 15.00, 'REJECTED')
ON CONFLICT (slug) DO NOTHING;

-- Update rejection reason for the rejected vendor
UPDATE vendors
SET rejection_reason = 'Discrepancy in GSTIN and manufacturing facility failed physical compliance check.'
WHERE id = 'b0000000-0000-0000-0000-000000000005';

-- Business Details for Vendors
INSERT INTO vendor_business_details (id, vendor_id, legal_business_name, business_type, tax_id_gstin, pan_number, bank_account_number, bank_ifsc_code, bank_name, bank_account_holder_name, is_verified) VALUES
('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Alight International Pvt Ltd', 'PRIVATE_LIMITED', '27AAACA9999F1Z0', 'AAACA9999F', '00091400001827', 'HDFC0000009', 'HDFC Bank Ltd', 'Alight International Pvt Ltd', TRUE),
('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Heritage Brass Works LLP', 'PARTNERSHIP', '07AAAAA1111A1Z1', 'AAAAA1111A', '50200028192817', 'ICIC0000102', 'ICICI Bank', 'Heritage Brass Works LLP', FALSE),
('b1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Apex Budget Trade Links', 'PROPRIETORSHIP', '06ABCDE5555F1Z9', 'ABCDE5555F', '30918273645102', 'SBIN0001234', 'State Bank of India', 'Apex Budget Trade Links', FALSE)
ON CONFLICT (vendor_id) DO NOTHING;

-- Pickup Addresses
INSERT INTO vendor_pickup_addresses (id, vendor_id, contact_person, contact_phone, address_line1, city, state, postal_code, is_primary) VALUES
('b2000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Alight Logistics Center', '+919876543214', 'Warehouse B4, Bhiwandi Logistics Hub', 'Bhiwandi', 'Maharashtra', '421302', TRUE),
('b2000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Devendra Singhal', '+919876543215', '14 Industrial Area, Brass Cluster', 'Aligarh', 'Uttar Pradesh', '202001', TRUE)
ON CONFLICT DO NOTHING;

-- Initialize Wallets for Vendors
INSERT INTO vendor_wallets (id, vendor_id, available_balance, pending_balance, total_withdrawn, currency_code) VALUES
('b3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 150000.00, 25000.00, 500000.00, 'INR'),
('b3000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 0.00, 0.00, 0.00, 'INR')
ON CONFLICT (vendor_id) DO NOTHING;

-- 3. Category Tree Expansion (Adding 5th Root: Sliding & Door Systems and Pantry Units)
INSERT INTO categories (id, parent_id, name, slug, description, display_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000005', NULL, 'Sliding & Door Systems', 'sliding-door-systems', 'Heavy-duty acoustic sliding track systems, rustic barn door hardware, and concealed door controls.', 5, TRUE),
('c1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Pantry Tall Units & Larders', 'pantry-tall-units', 'Multi-tier vertical kitchen pantry pullout larder units with soft-close motion.', 4, TRUE),
('c5000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'Barn Door Hardware & Rollers', 'barn-door-hardware', 'Top-hung heavy gauge industrial barn door tracks and quiet roller carriages.', 1, TRUE),
('c5000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'Concealed Magnetic Locks', 'concealed-magnetic-locks', 'Friction-free silent magnetic latch mortise locks for premium interior doors.', 2, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 4. Brands Expansion
INSERT INTO brands (id, name, slug, description, is_active) VALUES
('d0000000-0000-0000-0000-000000000006', 'Kesseböhmer', 'kessebohmer', 'World-leading German premium smart kitchen storage solutions and ergonomic pull-out mechanisms.', TRUE),
('d0000000-0000-0000-0000-000000000007', 'Sugatsune', 'sugatsune', 'Japanese high-precision motion design hardware and architectural dampers.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. Rich Alight Hardware Products
INSERT INTO products (id, vendor_id, category_id, brand_id, title, slug, short_description, description, base_price, discount_price, sku, stock_quantity, status, is_featured, average_rating, review_count) VALUES
('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 'Alight SS304 Tall Pantry Pull-Out Larder Unit (6 Shelves)', 'alight-ss304-tall-pantry-pullout-unit', 'Commercial grade SS304 tall kitchen larder unit with 6 adjustable soft-close wire baskets for cabinet widths 450mm to 600mm.', 'Experience effortless kitchen organization with the Alight International Flagship 6-Shelf Tall Pantry Unit. Engineered with electro-polished SS304 stainless steel and synchronized heavy-duty slides supporting up to 100 kg total payload. Includes bi-directional soft-close braking dampers and anti-slip matting.', 24500.00, 21999.00, 'ALT-KTC-007', 45, 'ACTIVE', TRUE, 4.90, 18),
('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006', 'Kesseböhmer LeMans II High-Capacity Corner Swivel Tray (Anthracite)', 'kessebohmer-lemans-ii-corner-swivel-tray', 'German blind corner swivel storage system with 85° door opening clearance and 25 kg load capacity per shelf.', 'The patented LeMans II corner carousel turns dead corner cabinet space into fully accessible ergonomic storage. The elegant 20% curved fluid motion swings independently out in front of the cabinet. Finished in scratch-resistant textured Anthracite with solid wooden anti-slip bases.', 29800.00, 26500.00, 'ALT-KTC-008', 25, 'ACTIVE', TRUE, 4.95, 24),
('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 'c4000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Artisan Knurled Solid Brass T-Bar Architectural Pull Handle 300mm', 'artisan-knurled-brass-tbar-pull-handle-300mm', 'Forged solid brass kitchen and wardrobe T-bar pull handle featuring diamond-cut precision knurled grip.', 'Handcrafted from solid architectural brass billet and finished with an ultra-durable PVD coating that prevents tarnishing and fingerprints. Includes M4 mounting hardware suitable for 18mm to 25mm cabinet door faces.', 1850.00, 1599.00, 'ALT-HND-009', 180, 'ACTIVE', TRUE, 4.85, 42),
('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'Luxe Suede-Lined Velvet Watch & Cufflink Organizer Drawer Insert', 'luxe-suede-velvet-watch-cufflink-tray', 'Italian microfiber suede drawer organizer featuring 8 plush watch pillows and dual ring rolls for master closets.', 'Constructed with a solid engineered timber substrate wrapped in rich warm taupe microfiber velvet. Designed to drop into standard 600mm or 900mm wardrobe drawers.', 3200.00, 2850.00, 'ALT-WRD-010', 50, 'ACTIVE', FALSE, 4.70, 9),
('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'Heavy Duty Top-Hung Soft-Close Sliding Barn Door Hardware Kit 2.0M', 'heavy-duty-sliding-barn-door-hardware-kit', 'Precision architectural sliding barn door kit with dual bi-directional hydraulic dampeners and ultra-quiet nylon wheels.', 'Supports interior solid wood or glass frame doors weighing up to 120 kg. Features a 2000mm solid carbon steel rail in powder-coated matte black finish with concealed soft-stop catches at both extremities.', 7900.00, 6800.00, 'ALT-SLD-011', 35, 'ACTIVE', TRUE, 4.80, 15),
('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000003', 'c5000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'Concealed Magnetic Mortise Door Lock with Silent Latch Mechanism', 'concealed-magnetic-mortise-door-lock', 'European standard silent magnetic mortise entry lock with solid brass faceplate and reversible latch.', 'Eliminates latch strike plate impact noise. When the door is ajar, the magnetic bolt is fully retracted flush into the door leaf, protruding only upon magnetic alignment with the frame strike plate.', 2400.00, 1999.00, 'ALT-LCK-012', 120, 'ACTIVE', FALSE, 4.90, 31)
ON CONFLICT (sku) DO NOTHING;

-- 6. Product Attributes
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value, display_order) VALUES
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'Material', 'Stainless Steel 304 Electro-Polished', 1),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'Dimensions', '450mm W x 500mm D x 1950-2200mm H', 2),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'Weight Capacity', '100 kg', 3),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'Warranty', '10-Year Anti-Rust Replacement Warranty', 4),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'HSN Code', '73239390', 5),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000008', 'Origin', 'Baden-Württemberg, Germany', 1),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000008', 'Mechanism', 'LeMans II Swivel with ClickFixx Assembly', 2),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000008', 'Finish', 'Anthracite with Solid Anti-Slip Base', 3),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 'Material', 'Grade-A Architectural Forged Brass', 1),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 'Length', '300 mm (Hole Center: 256 mm)', 2),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 'Coating', 'Advanced PVD (Anti-Tarnish / Anti-Fingerprint)', 3),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000011', 'Track Length', '2000 mm (Carbon Steel)', 1),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000011', 'Damping', 'Dual Bi-Directional Hydraulic Dampeners', 2),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000012', 'Backset', '50 mm', 1),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000012', 'Latch Type', 'Silent Flush Magnetic Retractable Latch', 2)
ON CONFLICT DO NOTHING;

-- 7. Product Images
INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary) VALUES
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop', 'Alight SS304 Tall Pantry Unit Front View', 1, TRUE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&auto=format&fit=crop', 'Alight SS304 Tall Pantry Unit In-Cabinet Action', 2, FALSE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop', 'Kessebohmer LeMans II Swivel Corner Tray Anthracite', 1, TRUE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop', 'Artisan Knurled Solid Brass T-Bar Handle Satin Brass', 1, TRUE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop', 'Luxe Velvet Watch Drawer Organizer Insert', 1, TRUE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop', 'Heavy Duty Soft-Close Sliding Barn Door Hardware Kit', 1, TRUE),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop', 'Concealed Magnetic Mortise Door Lock Brass Faceplate', 1, TRUE)
ON CONFLICT DO NOTHING;

-- 8. Product Variants
INSERT INTO product_variants (id, product_id, variant_name, variant_sku, price, stock_quantity, is_active) VALUES
('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000007', 'Cabinet Width 450mm', 'ALT-KTC-007-450', 21999.00, 25, TRUE),
('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000007', 'Cabinet Width 600mm', 'ALT-KTC-007-600', 25499.00, 20, TRUE),
('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000009', 'Satin Brass Finish (256mm)', 'ALT-HND-009-SB', 1599.00, 80, TRUE),
('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000009', 'Matte Black PVD (256mm)', 'ALT-HND-009-MB', 1749.00, 60, TRUE),
('f0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000009', 'Rose Copper PVD (256mm)', 'ALT-HND-009-RC', 1849.00, 40, TRUE)
ON CONFLICT (variant_sku) DO NOTHING;

-- 9. Product Tier Pricing (B2B Bulk Pricing Matrix)
INSERT INTO product_tier_prices (id, product_id, min_quantity, tier_price) VALUES
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 5, 19999.00),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000007', 10, 18500.00),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 20, 1399.00),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000009', 50, 1199.00),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000012', 10, 1750.00),
(gen_random_uuid(), 'e0000000-0000-0000-0000-000000000012', 30, 1550.00)
ON CONFLICT DO NOTHING;

-- 10. Multi-Warehouse Stock Allocation
INSERT INTO warehouse_stock (id, warehouse_id, product_id, variant_id, quantity_on_hand, quantity_reserved, reorder_threshold, safety_stock) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007', NULL, 30, 0, 5, 2),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000007', NULL, 15, 0, 3, 1),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000008', NULL, 20, 0, 4, 2),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008', NULL, 5, 0, 2, 1),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000009', NULL, 100, 0, 20, 5),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000009', NULL, 80, 0, 15, 5),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000011', NULL, 25, 0, 5, 2),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000011', NULL, 10, 0, 2, 1),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000012', NULL, 80, 0, 15, 5),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000012', NULL, 40, 0, 10, 3)
ON CONFLICT DO NOTHING;
