package com.alight.marketplace.modules.personalization.dto;

import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalizationOverviewDto {
    private List<ProductSummaryDto> recentlyViewed;
    private List<ProductSummaryDto> recommended;
    private List<ProductSummaryDto> trending;
}
