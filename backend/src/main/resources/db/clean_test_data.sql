-- ==========================================================
-- Alight Marketplace: Purge Test Data Script
-- Preserves:
--  1. Admin accounts (admin@alight.com, superadmin@alight.com)
--  2. RBAC Permissions, Roles and Admin Role Bindings
--  3. Category Hierarchy Tree
--  4. Brands Master Catalog
--  5. Currencies & Tax Categories / Rules
--  6. Platform Central Fulfillment Center Warehouse
-- Removes:
--  1. All test sales, master orders, vendor orders, order items & addresses
--  2. All test payments, transactions & webhooks
--  3. All test settlements, payouts, vendor wallets & ledger entries
--  4. All test logistics shipments, tracking events & inventory reservations
--  5. All test returns and RMAs
--  6. All test carts, quotes, coupon usages & wishlists
--  7. All test reviews, Q&A, activity logs & support tickets
--  8. All test vendors, vendor details & vendor pickup addresses
--  9. All test products, variants, images, attributes & stock
-- 10. All test/registered persons, addresses and tokens (except admin)
-- ==========================================================

BEGIN;

-- 1. Returns & RMAs (depend on orders and order_items)
DELETE FROM rma_events;
DELETE FROM rma_items;
DELETE FROM rma_requests;
DELETE FROM rma_policies;

-- 2. Settlements, Wallets & Financial Ledgers (depend on orders and order_items)
DELETE FROM settlement_items;
DELETE FROM settlement_adjustments;
DELETE FROM settlements;
DELETE FROM vendor_payouts;
DELETE FROM payout_batches;
DELETE FROM wallet_transactions;
DELETE FROM vendor_wallets;
DELETE FROM vendor_debt_recoveries;
DELETE FROM marketplace_commission_invoices;
DELETE FROM reconciliation_records;
DELETE FROM tax_compliance_ledgers;

-- 3. Shipping & Logistics (depend on vendor_orders and orders)
DELETE FROM shipment_tracking_events;
DELETE FROM shipment_packages;

-- 4. Stock Reservations & Inventory Transactions (depend on orders and products)
DELETE FROM stock_reservations;
DELETE FROM inventory_transactions;

-- 5. Sales, Orders, Suborders, Order Items, Order Addresses & Payments
DELETE FROM order_items;
DELETE FROM vendor_orders;
DELETE FROM order_addresses;
DELETE FROM payment_transactions;
DELETE FROM payment_webhooks;
DELETE FROM orders;

-- 6. Carts, Quotes & Coupons
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM quote_items;
DELETE FROM quote_requests;
DELETE FROM coupon_usages;

-- 7. Reviews, Q&A, Support & Activity
DELETE FROM review_votes;
DELETE FROM reviews;
DELETE FROM question_votes;
DELETE FROM product_answers;
DELETE FROM product_questions;
DELETE FROM ticket_messages;
DELETE FROM support_tickets;
DELETE FROM notifications;
DELETE FROM wishlist_items;
DELETE FROM wishlists;
DELETE FROM recently_viewed_products;
DELETE FROM audit_logs;

-- 8. Products, Catalog Items & Vendor Warehouses
DELETE FROM warehouse_stock;
DELETE FROM product_images;
DELETE FROM product_attributes;
DELETE FROM product_tier_prices;
DELETE FROM product_variants;
DELETE FROM product_bundle_items;
DELETE FROM product_bundles;
DELETE FROM products;
DELETE FROM warehouses WHERE vendor_id IS NOT NULL;

-- 9. Vendors
DELETE FROM vendor_pickup_addresses;
DELETE FROM vendor_business_details;
DELETE FROM vendors;

-- 10. Non-Admin Users and Associated Tokens
DELETE FROM user_addresses WHERE user_id NOT IN (
    SELECT id FROM users WHERE email IN ('admin@alight.com', 'superadmin@alight.com')
);

DELETE FROM refresh_tokens WHERE user_id NOT IN (
    SELECT id FROM users WHERE email IN ('admin@alight.com', 'superadmin@alight.com')
);

DELETE FROM email_verification_tokens WHERE user_id NOT IN (
    SELECT id FROM users WHERE email IN ('admin@alight.com', 'superadmin@alight.com')
);

DELETE FROM password_reset_tokens WHERE user_id NOT IN (
    SELECT id FROM users WHERE email IN ('admin@alight.com', 'superadmin@alight.com')
);

DELETE FROM user_roles WHERE user_id NOT IN (
    SELECT id FROM users WHERE email IN ('admin@alight.com', 'superadmin@alight.com')
);

DELETE FROM users WHERE email NOT IN ('admin@alight.com', 'superadmin@alight.com');

COMMIT;
