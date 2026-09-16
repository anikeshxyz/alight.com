package com.alight.marketplace.modules.coupon.dto;

import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import com.alight.marketplace.modules.coupon.entity.CouponScope;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponDto {
    private UUID id;
    private String code;
    private String title;
    private String description;
    private CouponDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private Integer usageLimitTotal;
    private Integer usageLimitPerUser;
    private Integer totalUsedCount;
    private Instant validFrom;
    private Instant validUntil;
    private Boolean isActive;
    private CouponScope scope;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID categoryId;
    private String categoryName;
    private UUID productId;
    private String productTitle;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
