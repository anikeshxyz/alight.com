package com.alight.marketplace.modules.product.dto;

import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.vendor.dto.PublicVendorStoreDto;
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
public class ProductDetailDto {
    private UUID id;
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
    private boolean inStock;
    private ProductStatus status;
    private boolean featured;

    private CategoryDto category;
    private BrandDto brand;
    private PublicVendorStoreDto vendor;

    @Builder.Default
    private List<ProductImageDto> images = new ArrayList<>();

    @Builder.Default
    private List<ProductAttributeDto> attributes = new ArrayList<>();

    @Builder.Default
    private List<ProductVariantDto> variants = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
