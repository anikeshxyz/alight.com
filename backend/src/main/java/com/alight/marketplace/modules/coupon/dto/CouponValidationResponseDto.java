package com.alight.marketplace.modules.coupon.dto;

import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponValidationResponseDto {
    private boolean valid;
    private String message;
    private UUID couponId;
    private String couponCode;
    private String title;
    private CouponDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal revisedSubtotal;
    private BigDecimal revisedShipping;
    private BigDecimal revisedGrandTotal;
    private List<VendorDiscountBreakdownDto> vendorBreakdowns;
}
