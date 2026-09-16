package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnalyticsOverviewDTO {

    private BigDecimal grossMerchandiseValue; // Total GMV
    private BigDecimal netPlatformRevenue;     // Total Commission earned
    private BigDecimal escrowInTransit;         // Pending escrow balances
    private BigDecimal totalPayoutsDisbursed;   // Paid out to sellers
    private long totalOrdersCount;
    private long completedOrdersCount;
    private long activeVendorsCount;
    private long activeCustomersCount;
    private double averageOrderValue;
    private double returnDisputeRate;

    private List<RevenueTrajectoryDTO> revenueTrajectory;
    private List<CategorySalesShareDTO> topCategories;
    private List<VendorLeaderboardDTO> topVendors;
}
