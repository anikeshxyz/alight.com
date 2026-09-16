package com.alight.marketplace.modules.pricing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductTierPriceDto {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private Integer minQuantity;
    private Integer maxQuantity;
    private BigDecimal tierPrice;
    private BigDecimal discountPercent;
}
