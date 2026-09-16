package com.alight.marketplace.modules.search.dto;

import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultDto {
    private List<ProductSummaryDto> products;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private String query;
    private SearchFacetsDto facets;
}
