package com.alight.marketplace.modules.logistics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateShipmentRequest {

    @NotNull(message = "Vendor sub-order ID is required")
    private UUID vendorOrderId;

    private String carrierCode; // Optional, auto-assigns fastest/highest priority carrier if empty

    @Builder.Default
    private String shippingMode = "STANDARD";

    @Builder.Default
    private BigDecimal packageLengthCm = new BigDecimal("15.00");

    @Builder.Default
    private BigDecimal packageWidthCm = new BigDecimal("10.00");

    @Builder.Default
    private BigDecimal packageHeightCm = new BigDecimal("5.00");

    @Builder.Default
    private BigDecimal deadWeightKg = new BigDecimal("0.50");

    private String pickupNotes;
}
