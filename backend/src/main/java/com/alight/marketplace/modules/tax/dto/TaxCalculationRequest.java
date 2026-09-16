package com.alight.marketplace.modules.tax.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxCalculationRequest {

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @Builder.Default
    private Integer quantity = 1;

    private String taxCategoryCode;
    private String hsnSacCode;

    // Origin (Warehouse or Vendor state)
    @Builder.Default
    private String originCountry = "IN";
    private String originState;

    // Destination (Shipping address)
    @Builder.Default
    private String destinationCountry = "IN";
    private String destinationState;
    private String destinationPostalCode;

    @Builder.Default
    private Boolean isTaxInclusive = true;
}
