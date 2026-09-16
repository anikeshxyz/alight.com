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
public class SettlementTaxRuleDto {
    private UUID id;
    private String taxRuleCode;
    private String name;
    private String jurisdiction;
    private String taxType;
    private BigDecimal ratePercentage;
    private String calculationBase;
    private String version;
    private Boolean isActive;
    private Instant effectiveFrom;
    private Instant effectiveUntil;
}
