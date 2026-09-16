package com.alight.marketplace.modules.coupon.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.coupon.dto.CouponDto;
import com.alight.marketplace.modules.coupon.dto.CouponStatsSummaryDto;
import com.alight.marketplace.modules.coupon.dto.CreateCouponDto;
import com.alight.marketplace.modules.coupon.service.CouponService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
@Tag(name = "Vendor Coupon Management", description = "Vendor-funded coupons and store discount campaigns")
public class VendorCouponController {

    private final CouponService couponService;

    @GetMapping
    @Operation(summary = "Page through vendor created discount coupons")
    public ResponseEntity<ApiResponse<Page<CouponDto>>> getVendorCoupons(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CouponDto> coupons = couponService.getVendorCoupons(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(coupons, "Vendor coupons retrieved"));
    }

    @PostMapping
    @Operation(summary = "Create a vendor-funded discount coupon")
    public ResponseEntity<ApiResponse<CouponDto>> createVendorCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateCouponDto dto
    ) {
        CouponDto coupon = couponService.createVendorCoupon(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(coupon, "Vendor coupon created successfully"));
    }

    @PostMapping("/{couponId}/toggle")
    @Operation(summary = "Toggle active status of vendor coupon")
    public ResponseEntity<ApiResponse<CouponDto>> toggleCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID couponId
    ) {
        CouponDto coupon = couponService.toggleVendorCoupon(couponId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(coupon, "Coupon status updated"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get vendor coupon campaign performance metrics")
    public ResponseEntity<ApiResponse<CouponStatsSummaryDto>> getVendorStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CouponStatsSummaryDto stats = couponService.getVendorCouponStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats, "Vendor coupon statistics retrieved"));
    }
}
