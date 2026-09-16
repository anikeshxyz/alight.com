package com.alight.marketplace.modules.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorDebtRecoveryDto {
    private UUID id;
    private String recoveryReference;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID adjustmentId;
    private BigDecimal originalAmount;
    private BigDecimal recoveredAmount;
    private BigDecimal remainingAmount;
    private String status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
