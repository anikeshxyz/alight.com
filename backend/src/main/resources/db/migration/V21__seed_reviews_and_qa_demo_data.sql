-- ==========================================================
-- Stage 12: Seed Reviews, Ratings & Product Q&A Demo Data
-- ==========================================================

-- 1. Seed Customer Reviews
INSERT INTO reviews (
    id, product_id, user_id, vendor_id, rating, title, comment, is_verified_purchase, images, status, helpful_count, unhelpful_count, vendor_response, vendor_responded_at, created_at
) VALUES
-- Review 1 for Modular SS304 Soft-Close Kitchen Pull-Out Basket
(
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    5,
    'Exceptional German engineering and silent damping!',
    'Installed this in my new modular kitchen renovation. The SS304 heavy-gauge steel feels indestructible and the synchronized bottom runners glide with zero wobble even when loaded with heavy oil glass bottles and cast iron spice grinders. Worth every rupee.',
    TRUE,
    '["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'APPROVED',
    14,
    1,
    'Thank you Rahul for your glowing review! We engineer our SS304 wire baskets to exceed standard 50,000-cycle durability tests. Enjoy your culinary workspace!',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
),
-- Review 2 for Artisan Knurled Solid Brass Cabinet Pull Handle
(
    'f0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    5,
    'Pure architectural luxury with superb knurled grip',
    'The lathe knurling provides a tactile satisfaction that standard cabinet handles cannot match. Heavy solid brass with a protective nano-lacquer coat that resists finger grease. Will definitely purchase more for my master wardrobe.',
    TRUE,
    '["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'APPROVED',
    9,
    0,
    'We are delighted that our lathe diamond cut knurling resonated with your design vision! Thank you for choosing Alight Hardware Atelier.',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
),
-- Review 3 for Kohler Architectural Towel Bar
(
    'f0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    4,
    'Sleek matte finish, straightforward dual-anchor install',
    'Super solid matte black double bar. Holds two bath sheets comfortably without bunching. Installation template was precise and concealed screws look completely seamless.',
    TRUE,
    '[]'::jsonb,
    'APPROVED',
    6,
    0,
    NULL,
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Update cached product ratings
UPDATE products SET average_rating = 5.00, review_count = 1 WHERE id = 'e0000000-0000-0000-0000-000000000001';
UPDATE products SET average_rating = 5.00, review_count = 1 WHERE id = 'e0000000-0000-0000-0000-000000000002';
UPDATE products SET average_rating = 4.00, review_count = 1 WHERE id = 'e0000000-0000-0000-0000-000000000003';

-- 3. Seed Product Questions & Answers
INSERT INTO product_questions (
    id, product_id, user_id, vendor_id, question_text, status, upvotes, created_at
) VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'What is the minimum internal carcass depth and width required for installing this 2-tier pull-out basket?',
    'APPROVED',
    8,
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    'f1000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'Does this solid brass handle come with mounting screws suitable for 18mm and 25mm thick shutters?',
    'APPROVED',
    5,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_answers (
    id, question_id, user_id, author_type, author_name, answer_text, is_verified_seller, is_accepted, status, upvotes, created_at
) VALUES
(
    'f2000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'VENDOR',
    'Alight Hardware Atelier (Official Vendor)',
    'Hello! This unit requires a minimum internal cabinet carcass depth of 500mm and an internal clear width of 200mm (suited for standard 250mm external cabinet modules). Drilling templates and 3D adjustment brackets are included in the box.',
    TRUE,
    TRUE,
    'APPROVED',
    11,
    CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    'f2000000-0000-0000-0000-000000000002',
    'f1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'VENDOR',
    'Alight Hardware Atelier (Official Vendor)',
    'Yes! Each handle includes two M4 breakaway/segment screws (45mm length) which can easily be snapped down to fit 18mm, 20mm, 22mm, and 25mm cabinetry panels.',
    TRUE,
    TRUE,
    'APPROVED',
    7,
    CURRENT_TIMESTAMP - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;
