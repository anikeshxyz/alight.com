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
public class CartResponseDto {
    private UUID cartId;
    private UUID userId;
    private String guestSessionId;
    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();
    @Builder.Default
    private List<CartItemDto> savedForLaterItems = new ArrayList<>();
    @Builder.Default
    private List<VendorCartGroupDto> vendorGroups = new ArrayList<>();
    private Integer totalItems;
    private Integer uniqueItems;
    private Integer savedForLaterCount;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal estimatedTaxAmount;
    private BigDecimal estimatedShippingAmount;
    private BigDecimal grandTotal;
    private String currency;
}
