package com.alight.marketplace.modules.coupon.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.coupon.dto.ApplyCouponRequestDto;
import com.alight.marketplace.modules.coupon.dto.CouponDto;
import com.alight.marketplace.modules.coupon.dto.CouponValidationResponseDto;
import com.alight.marketplace.modules.coupon.dto.PromotionBannerDto;
import com.alight.marketplace.modules.coupon.service.CouponService;
import com.alight.marketplace.modules.coupon.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
@Tag(name = "Public Coupons & Promotions", description = "Storefront coupon validation and promotional banner endpoints")
public class PublicCouponController {

    private final CouponService couponService;
    private final PromotionService promotionService;

    @PostMapping("/apply")
    @Operation(summary = "Validate a coupon code and calculate real-time discount breakdown")
    public ResponseEntity<ApiResponse<CouponValidationResponseDto>> applyCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ApplyCouponRequestDto request
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, email);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    @GetMapping("/available")
    @Operation(summary = "List currently active public marketplace coupons")
    public ResponseEntity<ApiResponse<List<CouponDto>>> getAvailableCoupons(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        List<CouponDto> coupons = couponService.getAvailablePublicCoupons(email);
        return ResponseEntity.ok(ApiResponse.success(coupons, "Available coupons retrieved"));
    }

    @GetMapping("/promotions")
    @Operation(summary = "Get active marketing campaign hero banners & deals")
    public ResponseEntity<ApiResponse<List<PromotionBannerDto>>> getActivePromotions() {
        List<PromotionBannerDto> promotions = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success(promotions, "Active promotions retrieved"));
    }
}
