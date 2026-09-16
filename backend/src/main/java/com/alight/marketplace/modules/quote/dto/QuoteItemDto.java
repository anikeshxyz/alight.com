package com.alight.marketplace.modules.quote.dto;

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
public class QuoteItemDto {
    private UUID id;
    private UUID quoteRequestId;
    private UUID variantId;
    private UUID productId;
    private String productTitle;
    private String variantSku;
    private String variantName;
    private String primaryImageUrl;
    private Integer requestedQuantity;
    private BigDecimal targetUnitPrice;
    private BigDecimal offeredUnitPrice;
    private BigDecimal regularPrice;
    private BigDecimal totalOfferedAmount;
    private String buyerNotes;
}
