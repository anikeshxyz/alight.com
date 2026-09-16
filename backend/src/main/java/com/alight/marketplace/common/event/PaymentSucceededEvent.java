package com.alight.marketplace.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSucceededEvent {
    private UUID orderId;
    private String transactionId;
    private BigDecimal amount;
    private String paymentMethod;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
