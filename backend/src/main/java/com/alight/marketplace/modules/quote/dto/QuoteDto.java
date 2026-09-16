package com.alight.marketplace.modules.quote.dto;

import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteDto {
    private UUID id;
    private String quoteNumber;
    private UUID buyerId;
    private String buyerName;
    private String buyerEmail;
    private UUID vendorId;
    private String vendorStoreName;
    private QuoteStatus status;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalOfferedAmount;
    private BigDecimal offeredShippingAmount;
    private BigDecimal grandOfferedTotal;
    private String buyerNotes;
    private String sellerNotes;
    private LocalDate requestedDeliveryDate;
    private OffsetDateTime validUntil;
    private UUID convertedOrderId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    @Builder.Default
    private List<QuoteItemDto> items = new ArrayList<>();
}
