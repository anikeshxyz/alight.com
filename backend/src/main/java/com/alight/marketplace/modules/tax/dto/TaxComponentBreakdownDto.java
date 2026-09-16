package com.alight.marketplace.modules.tax.dto;

import com.alight.marketplace.modules.tax.entity.TaxType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxComponentBreakdownDto {
    private TaxType componentType;
    private BigDecimal ratePercent;
    private BigDecimal taxAmount;
}
