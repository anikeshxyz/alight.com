package com.alight.marketplace.modules.settlement.service.payout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutResult {
    private boolean successful;
    private String providerTransactionId;
    private String utrNumber;
    private String status; // SUBMITTED, PROCESSING, SUCCESS, FAILED
    private String message;
    private Instant completedAt;
}
