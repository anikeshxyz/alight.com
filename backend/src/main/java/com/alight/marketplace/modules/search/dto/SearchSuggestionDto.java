package com.alight.marketplace.modules.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestionDto {
    private String title;
    private String slug;
    private String primaryImageUrl;
    private BigDecimal price;
    private String categoryName;
}
