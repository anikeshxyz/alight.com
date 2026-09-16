package com.alight.marketplace.modules.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookProcessResult {
    private boolean processed;
    private boolean duplicate;
    private String eventId;
    private String eventType;
    private String message;
    private UUID transactionId;
    private UUID orderId;
}
