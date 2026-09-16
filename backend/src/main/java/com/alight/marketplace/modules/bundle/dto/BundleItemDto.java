package com.alight.marketplace.modules.bundle.dto;

import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleItemDto {
    private UUID id;
    private UUID productId;
    private ProductSummaryDto product;
    private int quantity;
    private BigDecimal lineTotal; // basePrice * quantity
}
