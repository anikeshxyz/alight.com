package com.alight.marketplace.modules.vendor.dto;

import jakarta.validation.constraints.DecimalMax;
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
public class UpdateCommissionRequest {

    @NotNull(message = "Commission percentage is required")
    @DecimalMin(value = "0.00", message = "Commission cannot be less than 0%")
    @DecimalMax(value = "100.00", message = "Commission cannot exceed 100%")
    private BigDecimal commissionPercentage;
}
