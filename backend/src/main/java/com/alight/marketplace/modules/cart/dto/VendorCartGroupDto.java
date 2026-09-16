package com.alight.marketplace.modules.cart.dto;

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
public class VendorCartGroupDto {
    private UUID vendorId;
    private String storeName;
    private String storeSlug;
    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();
    private BigDecimal groupSubtotal;
    private BigDecimal groupDiscount;
    private BigDecimal groupTax;
    private BigDecimal groupShipping;
    private BigDecimal groupTotal;
    private Integer totalItems;
}
