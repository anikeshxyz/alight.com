package com.alight.marketplace.modules.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchFacetsDto {
    private Map<String, Long> categories;   // categoryName -> count
    private Map<String, Long> brands;       // brandName -> count
    private Map<String, Long> vendors;      // vendorStoreName -> count
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private long inStockCount;
    private long outOfStockCount;
    private long totalResults;
}
