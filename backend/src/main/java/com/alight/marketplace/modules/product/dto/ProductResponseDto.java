package com.alight.marketplace.modules.product.dto;

import com.alight.marketplace.modules.product.entity.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDto {
    private UUID id;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID categoryId;
    private String categoryName;
    private UUID brandId;
    private String brandName;

    private String title;
    private String slug;
    private String shortDescription;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String sku;
    private int stockQuantity;
    private int lowStockThreshold;
    private String hsnCode;
    private String tags;
    private ProductStatus status;
    private String rejectionReason;
    private boolean featured;

    @Builder.Default
    private List<ProductImageDto> images = new ArrayList<>();

    @Builder.Default
    private List<ProductAttributeDto> attributes = new ArrayList<>();

    @Builder.Default
    private List<ProductVariantDto> variants = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
