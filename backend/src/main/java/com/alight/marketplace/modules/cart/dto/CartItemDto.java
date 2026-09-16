package com.alight.marketplace.modules.cart.dto;

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
public class CartItemDto {
    private UUID id;
    private UUID variantId;
    private UUID productId;
    private String productTitle;
    private String productSlug;
    private String variantSku;
    private String variantName;
    private String primaryImageUrl;
    private UUID vendorId;
    private String vendorStoreName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal regularPrice;
    private BigDecimal priceAtAddition;
    private boolean priceChanged;
    private boolean savedForLater;
    private BigDecimal lineTotal;
    private BigDecimal lineTax;
    private BigDecimal lineDiscount;
    private Integer availableStock;
    private String hsnCode;
    private BigDecimal taxRate;
    private Integer minOrderQuantity;
}
