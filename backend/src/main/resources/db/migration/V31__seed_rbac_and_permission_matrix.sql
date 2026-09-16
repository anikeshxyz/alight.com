-- ==========================================================
-- Stage 3: RBAC & Comprehensive Permission Matrix Migration
-- Alight International Multi-Vendor Marketplace
-- ==========================================================

-- 1. Ensure Roles Exist
INSERT INTO roles (id, name, description) VALUES
('10000000-0000-0000-0000-000000000001', 'ROLE_CUSTOMER', 'Standard registered customer account for marketplace shopping and order management'),
('10000000-0000-0000-0000-000000000002', 'ROLE_VENDOR', 'Approved vendor account for store, catalog, and fulfillment management'),
('10000000-0000-0000-0000-000000000003', 'ROLE_ADMIN', 'Platform operational administrator with moderation, catalog control, and dispute handling'),
('10000000-0000-0000-0000-000000000004', 'ROLE_SUPER_ADMIN', 'Super administrator with full unrestricted system access and role management')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Seed 40+ Granular Domain Permissions
INSERT INTO permissions (name, description) VALUES
-- User & Profile Domain
('user:profile_manage', 'Read and update own user profile details'),
('user:address_manage', 'Manage saved shipping and billing addresses'),

-- Catalog & Product Domain
('catalog:read', 'Browse public and active catalog products and categories'),
('catalog:create', 'Create new draft products and variants under vendor account'),
('catalog:update', 'Update owned vendor product specifications, prices, and media'),
('catalog:delete', 'Delete or archive owned vendor products'),
('catalog:approve', 'Approve or reject vendor submitted products for marketplace listing'),
('catalog:publish', 'Publish or unpublish categories, brands, and featured collections'),

-- Inventory & Stock Domain
('inventory:read', 'View warehouse stock levels and stock reservation status'),
('inventory:update', 'Update owned product stock quantities on hand'),
('inventory:adjust', 'Perform physical stock reconciliation and safety threshold adjustments'),
('inventory:reserve', 'Hold stock reservations during customer checkout flow'),

-- Order & Multi-Vendor Fulfillment Domain
('order:read_own', 'View customer personal placed orders and tracking history'),
('order:read_vendor', 'View assigned vendor fulfillment sub-orders and customer shipping details'),
('order:read_all', 'View all marketplace master orders, sub-orders, and payments across vendors'),
('order:update_status', 'Update vendor order fulfillment status (PROCESSING, SHIPPED, DELIVERED)'),
('order:cancel', 'Cancel unfulfilled customer orders or cancel out-of-stock items'),

-- Vendor Management & KYC Domain
('vendor:profile_read', 'View vendor business profile, store settings, and badges'),
('vendor:profile_update', 'Update vendor store description, logo, and pickup warehouse addresses'),
('vendor:kyc_submit', 'Submit vendor GSTIN, PAN, and bank account details for verification'),
('vendor:verify_approve', 'Review, approve, or reject vendor onboarding applications'),
('vendor:commission_update', 'Configure custom commission rates and payout hold windows per vendor'),

-- Settlement, Escrow & Wallets Domain
('settlement:wallet_read', 'View vendor wallet balance, escrow holds, and transaction history'),
('settlement:payout_request', 'Initiate vendor withdrawal / payout request from available balance'),
('settlement:payout_approve', 'Approve vendor payout requests for disbursement'),
('settlement:payout_process', 'Execute bank transfer disbursements and generate monthly GST commission invoices'),

-- Support & Tickets Domain
('support:ticket_create', 'Open customer or vendor support dispute ticket'),
('support:ticket_reply', 'Reply to discussion messages in assigned support tickets'),
('support:ticket_assign', 'Assign support tickets to specific support agents or admin teams'),
('support:ticket_resolve', 'Close, escalate, or resolve support dispute tickets'),

-- Customer Reviews & QA Domain
('review:create', 'Post customer product reviews and upload verified purchase photos'),
('review:vote', 'Vote helpful or unhelpful on product reviews'),
('review:moderate', 'Moderate, approve, or hide customer product reviews'),
('qa:ask', 'Submit pre-purchase product questions'),
('qa:answer', 'Answer customer questions for owned vendor products'),
('qa:moderate', 'Moderate, edit, or delete inappropriate questions and answers'),

-- Promotions, Flash Sales & Coupons Domain
('coupon:create_vendor', 'Create vendor-specific discount coupon codes'),
('coupon:create_global', 'Create marketplace-wide global discount coupons and promotion rules'),
('coupon:manage_all', 'Manage, activate, or deactivate any marketplace coupon or flash sale'),

-- Logistics & Shipping Domain
('logistics:manifest_create', 'Generate carrier pickup manifests and packing slips'),
('logistics:label_generate', 'Generate shipping AWB labels and courier tracking numbers'),
('logistics:carrier_manage', 'Configure shipping carriers, pincode zones, and weight slab rates'),

-- Returns, RMA & Reverse Logistics Domain
('returns:request_create', 'Initiate 7-day customer return or exchange request with photo proof'),
('returns:vendor_action', 'Accept, reject, or request replacement for vendor return items'),
('returns:admin_override', 'Override return decisions and authorize immediate customer refund'),
('returns:inspect', 'Perform physical warehouse return quality inspection and grading'),

-- Analytics & Reporting Domain
('analytics:vendor_dashboard', 'View vendor sales volume, top products, ratings, and return rates'),
('analytics:platform_executive', 'View platform-wide GMV, vendor settlement ledger, and profit metrics'),

-- System Governance & Audit Domain
('system:user_role_manage', 'Assign, modify, and revoke user roles and fine-grained permissions'),
('system:audit_read', 'Inspect immutable system audit logs, actor trails, and security events'),
('system:config_manage', 'Configure marketplace currencies, tax jurisdictions, and payment gateways')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 3. Bind Permissions to Roles in role_permissions Join Table

-- ROLE_CUSTOMER Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_CUSTOMER' AND p.name IN (
    'user:profile_manage',
    'user:address_manage',
    'catalog:read',
    'order:read_own',
    'order:cancel',
    'support:ticket_create',
    'support:ticket_reply',
    'review:create',
    'review:vote',
    'qa:ask',
    'returns:request_create'
)
ON CONFLICT DO NOTHING;

-- ROLE_VENDOR Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_VENDOR' AND p.name IN (
    'user:profile_manage',
    'user:address_manage',
    'catalog:read',
    'catalog:create',
    'catalog:update',
    'catalog:delete',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'order:read_vendor',
    'order:update_status',
    'vendor:profile_read',
    'vendor:profile_update',
    'vendor:kyc_submit',
    'settlement:wallet_read',
    'settlement:payout_request',
    'support:ticket_create',
    'support:ticket_reply',
    'qa:answer',
    'coupon:create_vendor',
    'logistics:manifest_create',
    'logistics:label_generate',
    'returns:vendor_action',
    'analytics:vendor_dashboard'
)
ON CONFLICT DO NOTHING;

-- ROLE_ADMIN Permissions (All Vendor + Customer + Moderation + Operational)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_ADMIN' AND p.name IN (
    'user:profile_manage',
    'user:address_manage',
    'catalog:read',
    'catalog:create',
    'catalog:update',
    'catalog:delete',
    'catalog:approve',
    'catalog:publish',
    'inventory:read',
    'inventory:update',
    'inventory:adjust',
    'inventory:reserve',
    'order:read_own',
    'order:read_vendor',
    'order:read_all',
    'order:update_status',
    'order:cancel',
    'vendor:profile_read',
    'vendor:profile_update',
    'vendor:kyc_submit',
    'vendor:verify_approve',
    'vendor:commission_update',
    'settlement:wallet_read',
    'settlement:payout_request',
    'settlement:payout_approve',
    'support:ticket_create',
    'support:ticket_reply',
    'support:ticket_assign',
    'support:ticket_resolve',
    'review:create',
    'review:vote',
    'review:moderate',
    'qa:ask',
    'qa:answer',
    'qa:moderate',
    'coupon:create_vendor',
    'coupon:create_global',
    'coupon:manage_all',
    'logistics:manifest_create',
    'logistics:label_generate',
    'logistics:carrier_manage',
    'returns:request_create',
    'returns:vendor_action',
    'returns:admin_override',
    'returns:inspect',
    'analytics:vendor_dashboard',
    'analytics:platform_executive',
    'system:audit_read'
)
ON CONFLICT DO NOTHING;

-- ROLE_SUPER_ADMIN Permissions (Unrestricted Full Permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- 4. Seed Super Administrator User
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified) VALUES
('a0000000-0000-0000-0000-000000000099', 'superadmin@alight.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Alight', 'Super Admin', '+919876543299', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Assign ROLE_SUPER_ADMIN and ROLE_ADMIN to Super Administrator User
INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000099', id FROM roles WHERE name IN ('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_CUSTOMER')
ON CONFLICT DO NOTHING;

-- Assign ROLE_SUPER_ADMIN to existing Admin User as well
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@alight.com' AND r.name = 'ROLE_SUPER_ADMIN'
ON CONFLICT DO NOTHING;
