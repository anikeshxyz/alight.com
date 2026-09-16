package com.alight.marketplace.modules.settlement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualAdjustmentRequest {
    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    private UUID settlementId;

    @NotBlank(message = "Adjustment type is required (e.g. PENALTY, SELLER_CREDIT, SELLER_DEBIT, CORRECTION)")
    private String adjustmentType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Mandatory reason required for manual adjustment")
    private String reason;
}
