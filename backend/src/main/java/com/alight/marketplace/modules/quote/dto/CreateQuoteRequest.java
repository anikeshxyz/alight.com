package com.alight.marketplace.modules.quote.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuoteRequest {
    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotEmpty(message = "Quote must contain at least one item")
    @Valid
    private List<CreateQuoteItemDto> items;

    private String notes;

    private LocalDate requestedDeliveryDate;
}
