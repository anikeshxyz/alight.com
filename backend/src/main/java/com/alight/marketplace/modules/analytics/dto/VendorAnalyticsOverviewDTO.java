package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorAnalyticsOverviewDTO {

    private BigDecimal totalGrossSales;
    private BigDecimal netEarnings;
    private BigDecimal totalCommissionPaid;
    private BigDecimal totalTcsDeducted;
    private BigDecimal pendingEscrow;
    private BigDecimal availableBalance;
    private long totalOrdersCount;
    private double fulfillmentRate;
    private double returnRate;
    private double averageRating;

    private List<RevenueTrajectoryDTO> monthlySales;
}
