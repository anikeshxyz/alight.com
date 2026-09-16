package com.alight.marketplace.modules.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyCouponRequestDto {

    @NotBlank(message = "Coupon code is required")
    private String couponCode;

    @NotNull(message = "Cart subtotal is required")
    private BigDecimal cartSubtotal;

    private BigDecimal shippingAmount;

    private List<CartItemContextDto> items;
}
