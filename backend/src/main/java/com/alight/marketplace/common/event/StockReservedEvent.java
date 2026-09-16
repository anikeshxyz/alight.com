package com.alight.marketplace.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservedEvent {
    private UUID reservationId;
    private UUID productId;
    private UUID variantId;
    private int quantity;
    private Instant expiresAt;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
