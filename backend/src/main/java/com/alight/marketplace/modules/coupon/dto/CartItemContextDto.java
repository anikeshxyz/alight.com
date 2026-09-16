package com.alight.marketplace.modules.coupon.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemContextDto {
    private UUID productId;
    private UUID variantId;
    private UUID vendorId;
    private UUID categoryId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
