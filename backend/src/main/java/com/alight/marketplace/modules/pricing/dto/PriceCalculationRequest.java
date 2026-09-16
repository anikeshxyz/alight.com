package com.alight.marketplace.modules.pricing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceCalculationRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    private UUID variantId;

    @Builder.Default
    private Integer quantity = 1;

    @Builder.Default
    private String targetCurrency = "INR";

    private String originState;
    private String destinationState;
    private String destinationCountry;
    private String destinationPostalCode;
}
