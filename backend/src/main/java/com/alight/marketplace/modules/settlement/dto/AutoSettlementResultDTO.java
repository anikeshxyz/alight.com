package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoSettlementResultDTO {

    private int ordersProcessed;
    private int ordersSettled;
    private BigDecimal totalAmountReleased;
    private BigDecimal totalCommissionDeducted;
    private BigDecimal totalTcsDeducted;
    private List<String> settledOrderNumbers;
    private String message;
}
