-- V42: Coupons, Promotions, Flash Deals & Referral Engine Enhancements

-- 1. Add Referral and Promotion enhancements
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS referral_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(50) DEFAULT 'FLASH_DEAL';

-- 2. Performance Indexes for Coupons, Usages, and Promotions
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active_timing ON promotions(is_active, start_time, end_time);
