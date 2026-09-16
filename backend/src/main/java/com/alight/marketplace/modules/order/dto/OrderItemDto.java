package com.alight.marketplace.modules.order.dto;

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
public class OrderItemDto {
    private UUID id;
    private UUID orderId;
    private UUID vendorOrderId;
    private UUID vendorId;
    private UUID productId;
    private UUID variantId;
    private String productTitle;
    private String variantSku;
    private String variantName;
    private String primaryImageUrl;
    private String hsnCode;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal regularPrice;
    private BigDecimal discountAmount;
    private BigDecimal subtotalAmount;
    private BigDecimal taxRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalTaxAmount;
    private BigDecimal totalAmount;
}
