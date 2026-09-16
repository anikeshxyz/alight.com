package com.alight.marketplace.modules.logistics.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateCalculationRequest {

    @NotBlank(message = "Destination pincode is required")
    private String destinationPincode;

    private String originPincode;

    @Builder.Default
    private String shippingMode = "STANDARD";

    @DecimalMin(value = "0.01", message = "Weight must be greater than 0")
    @Builder.Default
    private BigDecimal weightKg = new BigDecimal("0.50");

    private BigDecimal lengthCm;
    private BigDecimal widthCm;
    private BigDecimal heightCm;
    private BigDecimal declaredValue;
}
