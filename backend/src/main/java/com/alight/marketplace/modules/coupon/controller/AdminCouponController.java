package com.alight.marketplace.modules.coupon.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.coupon.dto.CouponDto;
import com.alight.marketplace.modules.coupon.dto.CouponStatsSummaryDto;
import com.alight.marketplace.modules.coupon.dto.CreateCouponDto;
import com.alight.marketplace.modules.coupon.dto.PromotionBannerDto;
import com.alight.marketplace.modules.coupon.service.CouponService;
import com.alight.marketplace.modules.coupon.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Coupon & Promotion Oversight", description = "Global marketplace coupon management, campaign banners, and discount accounting")
public class AdminCouponController {

    private final CouponService couponService;
    private final PromotionService promotionService;

    @GetMapping
    @Operation(summary = "Search all marketplace discount coupons")
    public ResponseEntity<ApiResponse<Page<CouponDto>>> searchCoupons(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CouponDto> coupons = couponService.searchAdminCoupons(search, activeOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(coupons, "Coupons retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Create a platform-wide or targeted coupon")
    public ResponseEntity<ApiResponse<CouponDto>> createCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateCouponDto dto
    ) {
        CouponDto coupon = couponService.createAdminCoupon(dto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(coupon, "Coupon created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing coupon")
    public ResponseEntity<ApiResponse<CouponDto>> updateCoupon(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCouponDto dto
    ) {
        CouponDto coupon = couponService.updateAdminCoupon(id, dto);
        return ResponseEntity.ok(ApiResponse.success(coupon, "Coupon updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a coupon")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable UUID id) {
        couponService.deleteAdminCoupon(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Coupon deleted successfully"));
    }

    @PostMapping("/{id}/toggle")
    @Operation(summary = "Toggle active status of a coupon")
    public ResponseEntity<ApiResponse<CouponDto>> toggleCoupon(@PathVariable UUID id) {
        CouponDto coupon = couponService.toggleAdminCoupon(id);
        return ResponseEntity.ok(ApiResponse.success(coupon, "Coupon status toggled"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get global marketplace coupon performance statistics")
    public ResponseEntity<ApiResponse<CouponStatsSummaryDto>> getAdminStats() {
        CouponStatsSummaryDto stats = couponService.getAdminCouponStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Marketplace coupon statistics retrieved"));
    }

    // Promotions Management
    @GetMapping("/promotions")
    @Operation(summary = "Get all marketing campaign banners")
    public ResponseEntity<ApiResponse<List<PromotionBannerDto>>> getAllPromotions() {
        List<PromotionBannerDto> promotions = promotionService.getAllPromotionsAdmin();
        return ResponseEntity.ok(ApiResponse.success(promotions, "Promotion banners retrieved"));
    }

    @PostMapping("/promotions")
    @Operation(summary = "Create a marketing campaign hero banner")
    public ResponseEntity<ApiResponse<PromotionBannerDto>> createPromotion(
            @Valid @RequestBody PromotionBannerDto dto
    ) {
        PromotionBannerDto promotion = promotionService.createPromotion(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(promotion, "Promotion banner created successfully"));
    }

    @PutMapping("/promotions/{id}")
    @Operation(summary = "Update a marketing campaign hero banner")
    public ResponseEntity<ApiResponse<PromotionBannerDto>> updatePromotion(
            @PathVariable UUID id,
            @Valid @RequestBody PromotionBannerDto dto
    ) {
        PromotionBannerDto promotion = promotionService.updatePromotion(id, dto);
        return ResponseEntity.ok(ApiResponse.success(promotion, "Promotion banner updated successfully"));
    }

    @DeleteMapping("/promotions/{id}")
    @Operation(summary = "Delete a marketing campaign hero banner")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable UUID id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Promotion banner deleted successfully"));
    }
}
