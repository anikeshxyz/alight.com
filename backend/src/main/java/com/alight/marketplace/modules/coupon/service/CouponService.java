package com.alight.marketplace.modules.coupon.service;

import com.alight.marketplace.modules.coupon.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CouponService {

    // Public / Customer Operations
    CouponValidationResponseDto validateAndCalculateDiscount(ApplyCouponRequestDto request, String userEmail);

    List<CouponDto> getAvailablePublicCoupons(String userEmail);

    void recordCouponUsage(UUID couponId, UUID userId, UUID orderId, BigDecimal discountAmount);

    // Vendor Operations
    CouponDto createVendorCoupon(String vendorEmail, CreateCouponDto dto);

    Page<CouponDto> getVendorCoupons(String vendorEmail, Pageable pageable);

    CouponDto toggleVendorCoupon(UUID couponId, String vendorEmail);

    CouponStatsSummaryDto getVendorCouponStats(String vendorEmail);

    // Admin Operations
    CouponDto createAdminCoupon(CreateCouponDto dto, String adminEmail);

    CouponDto updateAdminCoupon(UUID id, CreateCouponDto dto);

    void deleteAdminCoupon(UUID id);

    CouponDto toggleAdminCoupon(UUID id);

    Page<CouponDto> searchAdminCoupons(String searchTerm, Boolean activeOnly, Pageable pageable);

    CouponStatsSummaryDto getAdminCouponStats();
}
