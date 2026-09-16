package com.alight.marketplace.modules.product.dto;

import com.alight.marketplace.modules.product.entity.ProductStatus;
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
public class ProductSummaryDto {
    private UUID id;
    private String title;
    private String slug;
    private String shortDescription;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String primaryImageUrl;
    private String categoryName;
    private String categorySlug;
    private String brandName;
    private String vendorStoreName;
    private String vendorSlug;
    private int stockQuantity;
    private boolean inStock;
    private boolean featured;
    private ProductStatus status;
}
