package com.alight.marketplace.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    private UUID brandId;

    @NotBlank(message = "Product title is required")
    @Size(min = 3, max = 255, message = "Product title must be between 3 and 255 characters")
    private String title;

    private String shortDescription;
    private String description;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.01", message = "Base price must be greater than zero")
    private BigDecimal basePrice;

    private BigDecimal discountPrice;

    @NotNull(message = "Stock quantity is required")
    private Integer stockQuantity;

    private Integer lowStockThreshold;

    private String hsnCode;
    private String tags;

    @Builder.Default
    private List<ProductImageDto> images = new ArrayList<>();

    @Builder.Default
    private List<ProductAttributeDto> attributes = new ArrayList<>();

    @Builder.Default
    private List<ProductVariantDto> variants = new ArrayList<>();
}
