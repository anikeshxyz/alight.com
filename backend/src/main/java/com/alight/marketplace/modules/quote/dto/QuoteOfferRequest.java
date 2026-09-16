package com.alight.marketplace.modules.quote.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteOfferRequest {
    @NotEmpty(message = "Offer items cannot be empty")
    @Valid
    private List<QuoteOfferItemDto> items;

    private BigDecimal offeredShippingAmount;

    private String sellerNotes;

    @NotNull(message = "Validity period is required")
    @Future(message = "Validity date must be in the future")
    private OffsetDateTime validUntil;
}
