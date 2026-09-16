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
public class ReconciliationRecordDto {
    private UUID id;
    private String recordReference;
    private String reconciliationType;
    private String externalReference;
    private String ledgerReference;
    private BigDecimal expectedAmount;
    private BigDecimal actualAmount;
    private BigDecimal differenceAmount;
    private String status;
    private String discrepancyReason;
    private Instant reconciledAt;
    private String reconciledBy;
}
