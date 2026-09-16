package com.alight.marketplace.modules.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationRequest {

    /**
     * Optional client session token or checkout session identifier.
     * If not supplied, a new reservation token is generated.
     */
    private String reservationToken;

    @NotNull(message = "Product ID is required")
    private UUID productId;

    private UUID variantId;

    /**
     * Optional specific warehouse; if null, automatic best-match allocation is chosen.
     */
    private UUID warehouseId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Reserved quantity must be at least 1")
    private Integer quantity;

    /**
     * TTL in minutes (default 15 minutes, maximum 60).
     */
    @Builder.Default
    private int ttlMinutes = 15;
}
