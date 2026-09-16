package com.alight.marketplace.modules.coupon.dto;

import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import com.alight.marketplace.modules.coupon.entity.CouponScope;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCouponDto {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotBlank(message = "Coupon title is required")
    private String title;

    private String description;

    @NotNull(message = "Discount type is required")
    private CouponDiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.00", message = "Discount value must be non-negative")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    private BigDecimal minOrderAmount;

    private Integer usageLimitTotal;

    private Integer usageLimitPerUser;

    private Instant validFrom;

    private Instant validUntil;

    private Boolean isActive;

    private CouponScope scope;

    private UUID vendorId;

    private UUID categoryId;

    private UUID productId;
}
