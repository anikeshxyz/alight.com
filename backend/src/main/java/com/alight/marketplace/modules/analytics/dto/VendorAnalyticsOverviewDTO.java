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

    private String range; // "7d", "30d", "90d"
    private BigDecimal totalGrossSales;
    private BigDecimal grossSalesDelta;
    private BigDecimal netEarnings;
    private BigDecimal totalCommissionPaid;
    private BigDecimal totalTcsDeducted;
    private BigDecimal pendingEscrow;
    private BigDecimal availableBalance;
    private long totalOrdersCount;
    private BigDecimal orderVolumeDelta;
    private Double fulfillmentRate;
    private Double returnRate;
    private Double cancellationRate;
    private Double averageRating;

    // Real aggregated operational metrics
    private Long awaitingDispatchCount;
    private Long activeShipmentsCount;
    private Long lowStockCount;
    private Long outOfStockCount;
    private Long pendingRmaCount;
    private Long pendingQuoteCount;

    // Real top revenue-contributing products
    private List<VendorTopProductDTO> topProducts;

    private List<RevenueTrajectoryDTO> monthlySales;
}
