package com.alight.marketplace.modules.product.dto;

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
public class ProductVariantDto {
    private UUID id;
    private String variantSku;
    private String variantName;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private int stockQuantity;
    private BigDecimal weightGrams;
    private String barcode;
    private String imageUrl;
    private String attributesJson;
    private boolean active;
}
