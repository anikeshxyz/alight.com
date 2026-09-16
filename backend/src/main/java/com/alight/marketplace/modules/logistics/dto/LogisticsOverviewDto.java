package com.alight.marketplace.modules.logistics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogisticsOverviewDto {
    private long totalShipments;
    private long inTransitCount;
    private long outForDeliveryCount;
    private long deliveredCount;
    private long rtoCount;
    private BigDecimal onTimeDeliveryPercentage;
    private double averageTransitDays;
    private long activeCarriersCount;
}
