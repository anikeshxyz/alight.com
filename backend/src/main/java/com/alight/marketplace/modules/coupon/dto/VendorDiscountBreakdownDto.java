package com.alight.marketplace.modules.coupon.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorDiscountBreakdownDto {
    private UUID vendorId;
    private String vendorStoreName;
    private BigDecimal eligibleSubtotal;
    private BigDecimal allocatedDiscount;
}
