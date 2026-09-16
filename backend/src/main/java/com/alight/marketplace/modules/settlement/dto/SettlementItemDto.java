package com.alight.marketplace.modules.settlement.dto;

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
public class SettlementItemDto {
    private UUID id;
    private UUID orderItemId;
    private String productTitle;
    private String sku;
    private Integer quantity;
    private BigDecimal grossAmount;
    private BigDecimal commissionAmount;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private String status;
}
