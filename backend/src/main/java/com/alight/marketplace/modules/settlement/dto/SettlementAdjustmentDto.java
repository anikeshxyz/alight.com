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
public class SettlementAdjustmentDto {
    private UUID id;
    private String adjustmentNumber;
    private UUID settlementId;
    private String settlementNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID rmaId;
    private String rmaNumber;
    private String adjustmentType;
    private BigDecimal amount;
    private String reason;
    private String createdBy;
    private String status;
    private Instant createdAt;
}
