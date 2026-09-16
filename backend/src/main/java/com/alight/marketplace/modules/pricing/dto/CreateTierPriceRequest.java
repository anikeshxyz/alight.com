package com.alight.marketplace.modules.pricing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class CreateTierPriceRequest {

    private UUID variantId;

    @NotNull(message = "Min quantity is required")
    @Min(value = 1, message = "Min quantity must be at least 1")
    private Integer minQuantity;

    private Integer maxQuantity;

    @NotNull(message = "Tier price is required")
    @DecimalMin(value = "0.00", message = "Tier price must be non-negative")
    private BigDecimal tierPrice;

    private BigDecimal discountPercent;
}
