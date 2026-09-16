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
public class SettlementRateCardDto {
    private UUID id;
    private String rateCardCode;
    private String name;
    private UUID categoryId;
    private String categoryName;
    private UUID vendorId;
    private String vendorStoreName;
    private BigDecimal commissionRate;
    private BigDecimal logisticsFeeFixed;
    private BigDecimal paymentGatewayFeePercent;
    private BigDecimal marketplaceFixedFee;
    private String version;
    private Boolean isActive;
    private Instant effectiveFrom;
    private Instant effectiveUntil;
}
