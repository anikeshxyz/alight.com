package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gstr8SummaryDTO {

    private String financialYear;
    private String quarter;
    private int vendorCount;
    private BigDecimal totalGrossSupplies;
    private BigDecimal totalReturnedSupplies;
    private BigDecimal totalNetTaxableSupplies;
    private BigDecimal totalTcsCollected;
    private BigDecimal totalTdsDeducted;
    private List<TaxComplianceLedgerDTO> vendorLedgers;
}
