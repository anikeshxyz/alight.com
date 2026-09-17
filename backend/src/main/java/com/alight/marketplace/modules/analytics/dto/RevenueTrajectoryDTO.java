package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueTrajectoryDTO {

    private String periodLabel; // e.g. "Jan 2026", "Feb 2026"
    private BigDecimal gmv;
    private BigDecimal netCommission;
    private BigDecimal netSettlement;
    private long orderCount;
}
