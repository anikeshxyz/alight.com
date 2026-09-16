-- ==========================================================
-- Stage 21: Granular Admin Roles & Enterprise Permissions Matrix
-- ==========================================================

-- 1. Insert Missing Domain Permissions
INSERT INTO permissions (name, description) VALUES
('cms:read', 'View storefront layouts, hero slides, and promotional banners'),
('cms:manage', 'Create, update, schedule, and publish storefront CMS content and banners'),
('risk:read', 'View marketplace risk scores, fraud alerts, and suspicious patterns'),
('risk:manage', 'Manage blacklists, whitelists, account restrictions, and fraud mitigation rules'),
('compliance:read', 'Inspect vendor KYC documents, GSTIN filings, and regulatory certifications'),
('compliance:verify', 'Approve, reject, or request re-submission for legal and tax compliance documents'),
('dispute:read', 'View customer-vendor transaction disputes, evidence, and escalations'),
('dispute:mediate', 'Mediate disputes, issue refund decisions, and apply ledger adjustments'),
('notification:manage', 'Manage transactional email, SMS, and push notification templates'),
('integration:manage', 'Configure payment gateways, courier APIs, and webhook subscriptions'),
('admin:user_manage', 'Create, disable, and manage admin operator accounts and role memberships')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Insert Granular Admin Roles
INSERT INTO roles (name, description) VALUES
('ROLE_MARKETPLACE_ADMIN', 'Marketplace operational administrator with oversight over vendors, customers, products, and categories'),
('ROLE_VENDOR_ADMIN', 'Vendor governance administrator with onboarding, KYC, and seller lifecycle control'),
('ROLE_CATALOG_ADMIN', 'Product catalog moderation administrator with attribute, image, and HSN compliance control'),
('ROLE_ORDER_ADMIN', 'Commerce and fulfillment administrator with order, consignment, and cancellation oversight'),
('ROLE_LOGISTICS_ADMIN', 'Supply chain and logistics administrator managing platform warehouses, carriers, and tracking'),
('ROLE_FINANCE_ADMIN', 'Finance and ledger administrator managing escrow settlements, fees, commissions, and reconciliation'),
('ROLE_TAX_ADMIN', 'Statutory tax administrator managing GST rates, HSN mappings, and TCS compliance'),
('ROLE_COMPLIANCE_ADMIN', 'Legal and regulatory compliance administrator managing KYC, GST, and brand authorizations'),
('ROLE_SUPPORT_ADMIN', 'Customer and vendor support desk administrator managing dispute mediation and tickets'),
('ROLE_MARKETING_ADMIN', 'Growth and marketing administrator managing coupons, campaigns, and storefront CMS'),
('ROLE_ANALYTICS_ADMIN', 'Business intelligence administrator with read-only access to reporting and performance metrics')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 3. Map Granular Permissions to Specific Admin Roles

-- ROLE_MARKETPLACE_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_MARKETPLACE_ADMIN' AND p.name IN (
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:approve', 'catalog:publish',
    'vendor:profile_read', 'vendor:profile_update', 'vendor:verify_approve', 'vendor:commission_update',
    'order:read_all', 'order:update_status', 'inventory:read', 'analytics:platform_executive'
) ON CONFLICT DO NOTHING;

-- ROLE_VENDOR_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_VENDOR_ADMIN' AND p.name IN (
    'vendor:profile_read', 'vendor:profile_update', 'vendor:kyc_submit', 'vendor:verify_approve', 'vendor:commission_update',
    'compliance:read', 'compliance:verify', 'analytics:vendor_dashboard'
) ON CONFLICT DO NOTHING;

-- ROLE_CATALOG_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_CATALOG_ADMIN' AND p.name IN (
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete', 'catalog:approve', 'catalog:publish',
    'review:moderate', 'qa:moderate'
) ON CONFLICT DO NOTHING;

-- ROLE_ORDER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_ORDER_ADMIN' AND p.name IN (
    'order:read_all', 'order:update_status', 'order:cancel',
    'returns:request_create', 'returns:vendor_action', 'returns:admin_override', 'returns:inspect',
    'dispute:read', 'dispute:mediate'
) ON CONFLICT DO NOTHING;

-- ROLE_LOGISTICS_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_LOGISTICS_ADMIN' AND p.name IN (
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:reserve',
    'logistics:manifest_create', 'logistics:label_generate', 'logistics:carrier_manage'
) ON CONFLICT DO NOTHING;

-- ROLE_FINANCE_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_FINANCE_ADMIN' AND p.name IN (
    'settlement:wallet_read', 'settlement:payout_request', 'settlement:payout_approve', 'settlement:payout_process',
    'order:read_all', 'analytics:platform_executive'
) ON CONFLICT DO NOTHING;

-- ROLE_TAX_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_TAX_ADMIN' AND p.name IN (
    'settlement:wallet_read', 'system:config_manage', 'compliance:read', 'compliance:verify'
) ON CONFLICT DO NOTHING;

-- ROLE_COMPLIANCE_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_COMPLIANCE_ADMIN' AND p.name IN (
    'compliance:read', 'compliance:verify', 'risk:read', 'risk:manage',
    'vendor:profile_read', 'dispute:read', 'dispute:mediate'
) ON CONFLICT DO NOTHING;

-- ROLE_SUPPORT_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_SUPPORT_ADMIN' AND p.name IN (
    'support:ticket_create', 'support:ticket_reply', 'support:ticket_assign', 'support:ticket_resolve',
    'dispute:read', 'dispute:mediate', 'order:read_all', 'returns:admin_override'
) ON CONFLICT DO NOTHING;

-- ROLE_MARKETING_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_MARKETING_ADMIN' AND p.name IN (
    'coupon:create_global', 'coupon:create_vendor', 'coupon:manage_all',
    'cms:read', 'cms:manage', 'analytics:platform_executive'
) ON CONFLICT DO NOTHING;

-- ROLE_ANALYTICS_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ROLE_ANALYTICS_ADMIN' AND p.name IN (
    'analytics:vendor_dashboard', 'analytics:platform_executive',
    'order:read_all', 'catalog:read', 'inventory:read'
) ON CONFLICT DO NOTHING;
