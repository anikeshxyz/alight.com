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
public class OrderStatusUpdatedEvent {
    private UUID orderId;
    private String orderNumber;
    private String oldStatus;
    private String newStatus;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
