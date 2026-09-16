package com.alight.marketplace.modules.vendor.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStoreSettingsRequest {

    private boolean vacationMode;

    @Size(max = 500, message = "Vacation message cannot exceed 500 characters")
    private String vacationMessage;

    private String shippingPolicy;

    private String refundPolicy;

    private String privacyPolicy;

    @Size(max = 255, message = "Custom domain cannot exceed 255 characters")
    private String customDomain;

    private boolean autoAcceptOrders;

    @DecimalMin(value = "0.00", message = "Minimum order amount cannot be negative")
    private BigDecimal minimumOrderAmount;
}
