-- ==========================================================
-- Stage 4: Comprehensive Catalog & Multi-Vendor Seed Data
-- ==========================================================

-- 1. Demo Users (Admin, Seller, Customer)
-- Password for all is: password123 ($2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Alight', 'Admin', '+919876543210', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000002', 'seller@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Vikram', 'Sharma', '+919876543211', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000003', 'luxe.seller@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Priya', 'Mehta', '+919876543212', TRUE, TRUE),
('a0000000-0000-0000-0000-000000000004', 'customer@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Rahul', 'Verma', '+919876543213', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Assign Roles
INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM roles WHERE name IN ('ROLE_ADMIN', 'ROLE_CUSTOMER')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM roles WHERE name IN ('ROLE_VENDOR', 'ROLE_CUSTOMER')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM roles WHERE name = 'ROLE_CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM roles WHERE name = 'ROLE_CUSTOMER'
ON CONFLICT DO NOTHING;

-- 2. Demo Vendors
INSERT INTO vendors (id, user_id, store_name, slug, description, support_email, support_phone, commission_percentage, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Alight Hardware Atelier', 'alight-hardware-atelier', 'Direct manufacturer of precision German-engineered architectural hardware, modular kitchen pull-outs, and luxury solid brass bath accessories.', 'atelier@alight.com', '+919876543211', 8.50, 'APPROVED'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Luxe Fittings Studio', 'luxe-fittings-studio', 'Bespoke European imported wardrobe organizers and acoustic sliding partitions.', 'support@luxefittings.com', '+919876543212', 10.00, 'PENDING_VERIFICATION')
ON CONFLICT (slug) DO NOTHING;

-- Vendor Business & Pickup Details
INSERT INTO vendor_business_details (id, vendor_id, legal_business_name, business_type, tax_id_gstin, pan_number, bank_account_number, bank_ifsc_code, bank_name, bank_account_holder_name, is_verified) VALUES
('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Alight Manufacturing & Exports Pvt Ltd', 'PRIVATE_LIMITED', '27AABCA1234F1Z5', 'AABCA1234F', '918273645019', 'HDFC0001234', 'HDFC Bank Ltd', 'Alight Manufacturing & Exports Pvt Ltd', TRUE)
ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendor_pickup_addresses (id, vendor_id, contact_person, contact_phone, address_line1, city, state, postal_code, is_primary) VALUES
('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Gopal Logistics', '+919876543211', 'Plot 42, Alight Industrial Park, Sector 58', 'Gurugram', 'Haryana', '122001', TRUE)
ON CONFLICT DO NOTHING;

-- 3. Category Hierarchy Tree
INSERT INTO categories (id, parent_id, name, slug, description, display_order, is_active) VALUES
-- Root Categories
('c0000000-0000-0000-0000-000000000001', NULL, 'Kitchen Accessories', 'kitchen-accessories', 'Premium modular kitchen wire baskets, carousel units, and pantry organizers.', 1, TRUE),
('c0000000-0000-0000-0000-000000000002', NULL, 'Bathroom Accessories', 'bathroom-accessories', 'Luxury brass towel bars, soap dispensers, shower drains, and vanity fittings.', 2, TRUE),
('c0000000-0000-0000-0000-000000000003', NULL, 'Wardrobe Accessories', 'wardrobe-accessories', 'Telescopic hangers, soft-close tie racks, jewelry trays, and pull-out mirrors.', 3, TRUE),
('c0000000-0000-0000-0000-000000000004', NULL, 'Architectural Hardware', 'architectural-hardware', 'Designer cabinet handles, mortise locks, soft-close hinges, and sliding door mechanisms.', 4, TRUE),

-- Subcategories under Kitchen
('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Modular Baskets & Pull-Outs', 'modular-baskets-pull-outs', 'Stainless steel SS304 soft-close pull-out baskets and spice racks.', 1, TRUE),
('c1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Cutlery Trays & Organizers', 'cutlery-trays', 'Wooden and acrylic drawer divider inserts.', 2, TRUE),
('c1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Corner Units & Magic Corners', 'magic-corners', 'Blind corner pull-out mechanisms maximizing dead storage space.', 3, TRUE),

-- Subcategories under Bathroom
('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Towel Rails & Rings', 'towel-rails-rings', 'Solid forged brass wall-mounted towel holders.', 1, TRUE),
('c2000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Shower Fixtures & Drains', 'shower-fixtures-drains', 'Linear tile-insert concealed shower drains and thermostatic valves.', 2, TRUE),

-- Subcategories under Wardrobe
('c3000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Pull-Out Trouser & Tie Racks', 'pull-out-trouser-racks', 'Damped slide organizers for closets and master wardrobes.', 1, TRUE),
('c3000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Velvet Jewelry Trays', 'velvet-jewelry-trays', 'Modular plush drawer organizers for watches, jewelry, and rings.', 2, TRUE),

-- Subcategories under Architectural Hardware
('c4000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Designer Cabinet Handles', 'cabinet-handles', 'Knurled solid brass T-bars, profile handles, and leather pulls.', 1, TRUE),
('c4000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'Concealed Soft-Close Hinges', 'concealed-hinges', 'Clip-top 110-degree 3D adjustable concealed hinges.', 2, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 4. Verified Brands
INSERT INTO brands (id, name, slug, logo_url, website_url, description, is_active) VALUES
('d0000000-0000-0000-0000-000000000001', 'Hafele', 'hafele', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=200&q=80', 'https://www.hafele.com', 'World leader in architectural hardware, furniture fittings, and electronic access systems.', TRUE),
('d0000000-0000-0000-0000-000000000002', 'Blum', 'blum', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=200&q=80', 'https://www.blum.com', 'Austrian precision lift systems, hinge systems, and drawer runner mechanisms.', TRUE),
('d0000000-0000-0000-0000-000000000003', 'Hettich', 'hettich', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=200&q=80', 'https://www.hettich.com', 'German intelligent technology for furniture, drawers, folding, and sliding fittings.', TRUE),
('d0000000-0000-0000-0000-000000000004', 'Kohler', 'kohler', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80', 'https://www.kohler.com', 'Global benchmark in luxury kitchen and bath plumbing craftsmanship.', TRUE),
('d0000000-0000-0000-0000-000000000005', 'Alight Atelier', 'alight-atelier', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80', 'https://alight.com', 'Our handcrafted signature line of solid brass architectural fixtures and bespoke organizers.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. Products Catalog
-- Product 1: Modular Stainless Steel Pull-Out Spice Rack
INSERT INTO products (id, vendor_id, category_id, brand_id, title, slug, short_description, description, base_price, discount_price, sku, stock_quantity, status, is_featured) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Modular SS304 Soft-Close Kitchen Pull-Out Basket', 'modular-ss304-soft-close-kitchen-pull-out-basket', 'Heavy-duty 2-tier stainless steel spice and bottle pull-out rack with synchronized soft-closing concealed runners.', 'Crafted from food-grade AISI-304 stainless steel with electro-polished chrome finish. Features 45kg load-rated synchronized soft-close bottom runners ensuring vibration-free movement even under full load. Tool-free clip-on basket assembly with adjustable dividers.', 4899.00, 3999.00, 'ALT-KTC-001', 85, 'ACTIVE', TRUE),

-- Product 2: Knurled Solid Brass T-Bar Cabinet Handle
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Artisan Knurled Solid Brass Cabinet Pull Handle', 'artisan-knurled-solid-brass-cabinet-pull-handle', 'Diamond knurled precision-machined solid brass T-bar handle for luxury kitchen cabinetry and wardrobes.', 'Individually lathe-machined from single-billet C36000 solid architectural brass. Finished with baked clear nano-lacquer to prevent tarnishing while maintaining the tactile brilliance of the diamond cut knurling. Includes M4 breakaway mounting screws.', 1250.00, 999.00, 'ALT-HND-002', 250, 'ACTIVE', TRUE),

-- Product 3: Luxury Double Towel Bar
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Kohler Architectural Matte Black Double Towel Bar 24"', 'kohler-architectural-matte-black-double-towel-bar-24', 'Architectural grade matte black 24-inch double towel bar with concealed dual-anchor mounting.', 'Designed with clean geometric lines and premium corrosion-resistant PVD finish. Tested against 480-hour salt spray benchmarks to ensure lifetime endurance in high-humidity luxury bathrooms. Concealed hardware prevents visible screws.', 3450.00, 2890.00, 'ALT-BTH-003', 40, 'ACTIVE', FALSE),

-- Product 4: Velvet Wardrobe Jewelry Organizer Tray
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Modular Suede Velvet Watch & Jewelry Insert', 'modular-suede-velvet-watch-jewelry-insert', 'Custom-fit wardrobe drawer organizer wrapped in anti-tarnish micro-suede with dedicated watch pillows.', 'Transform standard wardrobe drawers into a bespoke luxury boutique display. Includes 6 cushioned watch slots, 12 ring rolls, and 8 versatile accessory compartments lined with soft-touch champagne velvet.', 2750.00, 2200.00, 'ALT-WRD-004', 60, 'ACTIVE', TRUE),

-- Product 5: Magic Corner Blind Cabinet Pull-Out
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Hettich LeMans II Soft-Close Corner Carousel', 'hettich-lemans-ii-soft-close-corner-carousel', 'Ergonomic 2-shelf blind corner swinging carousel unit with non-slip arena anthracite trays.', 'Swings all shelf contents smoothly out of the blind kitchen corner cabinet with 25kg load capacity per tray. Soft-closing damping integrated in the pivot arm ensures silent operation.', 18500.00, 15990.00, 'ALT-KTC-005', 15, 'ACTIVE', TRUE),

-- Product 6: Pending Approval Item (For Admin Moderation Review Demonstration)
('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Blum CLIP top BLUMOTION 110 Soft-Close Hinge (Pack of 10)', 'blum-clip-top-blumotion-110-hinge-pack-of-10', 'All-metal nickel-plated 110-degree concealed hinge with integrated BLUMOTION soft-close in hinge boss.', 'Provides seamless door motion with integrated deactivation switch for lighter doors. Features 3-dimensional adjustment (+/-2mm side, depth, height) and tool-free CLIP assembly.', 3800.00, 3200.00, 'ALT-BLM-006', 100, 'PENDING_APPROVAL', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- 6. Product Images Gallery
INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
-- Product 1 images
('e0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', 'Modular Pull-Out Kitchen Rack Main View', 0, TRUE),
('e0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1000&q=80', 'Runner Detail and SS304 Baskets', 1, FALSE),

-- Product 2 images
('e0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80', 'Knurled Brass Handle Close-Up', 0, TRUE),
('e0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80', 'Installed on Dark Oak Cabinetry', 1, FALSE),

-- Product 3 images
('e0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80', 'Kohler Matte Black Towel Bar Front View', 0, TRUE),

-- Product 4 images
('e0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80', 'Velvet Jewelry Drawer Organizer Open View', 0, TRUE),

-- Product 5 images
('e0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80', 'LeMans Corner Carousel Extracted from Cabinet', 0, TRUE),

-- Product 6 images
('e0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80', 'Blum Soft-Close Concealed Hinge Set', 0, TRUE)
ON CONFLICT DO NOTHING;

-- 7. Product Technical Attributes
INSERT INTO product_attributes (product_id, attribute_name, attribute_value, display_order) VALUES
('e0000000-0000-0000-0000-000000000001', 'Material', 'Food Grade SS304 Stainless Steel', 0),
('e0000000-0000-0000-0000-000000000001', 'Load Capacity', '45 kg Synchronized Bottom Slides', 1),
('e0000000-0000-0000-0000-000000000001', 'Warranty', '10 Years Manufacturer Warranty', 2),

('e0000000-0000-0000-0000-000000000002', 'Material', 'Solid Forged C36000 Architectural Brass', 0),
('e0000000-0000-0000-0000-000000000002', 'Center-to-Center', '160 mm / 6.3 inches', 1),
('e0000000-0000-0000-0000-000000000002', 'Finish Coating', 'Electrostatically Baked Anti-Tarnish Clear Lacquer', 2),

('e0000000-0000-0000-0000-000000000003', 'Material', 'Solid Brass Core with PVD Coating', 0),
('e0000000-0000-0000-0000-000000000003', 'Length', '24 Inches (610 mm)', 1),
('e0000000-0000-0000-0000-000000000003', 'Finish', 'Matte Black PVD', 2),

('e0000000-0000-0000-0000-000000000004', 'Material', 'Engineered MDF wrapped in Anti-Tarnish Suede', 0),
('e0000000-0000-0000-0000-000000000004', 'Dimensions', '450 mm (W) x 480 mm (D) x 60 mm (H)', 1),

('e0000000-0000-0000-0000-000000000005', 'Opening Angle', '85-degree Door Clearance', 0),
('e0000000-0000-0000-0000-000000000005', 'Cabinet Width', '900 mm - 1000 mm Blind Corner', 1),
('e0000000-0000-0000-0000-000000000005', 'Tray Capacity', '25 kg per tray (50 kg total)', 2)
ON CONFLICT DO NOTHING;

-- 8. Product SKU Variants
INSERT INTO product_variants (product_id, variant_sku, variant_name, price, stock_quantity, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'ALT-KTC-001-200MM', '200mm Width Carcass', 3999.00, 50, TRUE),
('e0000000-0000-0000-0000-000000000001', 'ALT-KTC-001-300MM', '300mm Width Carcass', 4499.00, 35, TRUE),

('e0000000-0000-0000-0000-000000000002', 'ALT-HND-002-128MM', '128mm Hole Center - Satin Brass', 899.00, 100, TRUE),
('e0000000-0000-0000-0000-000000000002', 'ALT-HND-002-160MM', '160mm Hole Center - Satin Brass', 999.00, 100, TRUE),
('e0000000-0000-0000-0000-000000000002', 'ALT-HND-002-224MM', '224mm Hole Center - Antique Bronze', 1199.00, 50, TRUE),

('e0000000-0000-0000-0000-000000000003', 'ALT-BTH-003-24IN-BLK', '24 Inch - Matte Black', 2890.00, 25, TRUE),
('e0000000-0000-0000-0000-000000000003', 'ALT-BTH-003-24IN-GLD', '24 Inch - Brushed Vibrant Moderne Gold', 3290.00, 15, TRUE)
ON CONFLICT (variant_sku) DO NOTHING;
