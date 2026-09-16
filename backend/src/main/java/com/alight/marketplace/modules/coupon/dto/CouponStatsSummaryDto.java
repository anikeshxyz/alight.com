package com.alight.marketplace.modules.coupon.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponStatsSummaryDto {
    private long totalCoupons;
    private long activeCoupons;
    private long totalRedemptions;
    private BigDecimal totalDiscountGranted;
}
