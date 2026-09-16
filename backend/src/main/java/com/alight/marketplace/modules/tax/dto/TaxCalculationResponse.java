package com.alight.marketplace.modules.tax.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxCalculationResponse {
    private BigDecimal baseUnitPrice;
    private Integer quantity;
    private BigDecimal taxableSubtotal;
    private BigDecimal totalTaxRatePercent;
    private BigDecimal totalTaxAmount;
    private BigDecimal grandTotal;
    private Boolean isInterState;
    private String taxRegime;
    private String ruleName;
    private Boolean isTaxInclusive;
    @Builder.Default
    private List<TaxComponentBreakdownDto> components = new ArrayList<>();
}
