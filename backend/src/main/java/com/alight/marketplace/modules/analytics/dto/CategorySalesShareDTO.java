package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategorySalesShareDTO {

    private String categoryName;
    private BigDecimal salesAmount;
    private double percentageShare;
    private long itemsSold;
}
