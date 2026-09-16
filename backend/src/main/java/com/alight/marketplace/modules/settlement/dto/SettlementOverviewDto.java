package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementOverviewDto {
    private BigDecimal totalPlatformEscrowHold;
    private BigDecimal totalAvailableForPayout;
    private BigDecimal totalReservedInPayouts;
    private BigDecimal totalRecoveryDue;
    private BigDecimal totalCommissionsCollected;
    private BigDecimal totalTcsDeducted;
    private BigDecimal totalPayoutsDisbursed;
    private long pendingPayoutRequestsCount;
    private long pendingEligibilityCount;
    private long totalVendorsCount;
}
