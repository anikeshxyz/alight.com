package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveredSettlementDto {
    private UUID vendorOrderId;
    private String subOrderNumber;
    private String masterOrderNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private BigDecimal grossAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal tcsAmount;
    private BigDecimal netSettlementAmount;
    @com.fasterxml.jackson.annotation.JsonProperty("isSettled")
    private boolean isSettled;
    private Instant deliveredAt;
    private Instant createdAt;
}
