package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorPayoutDto {
    private UUID id;
    private String payoutReference;
    private UUID vendorId;
    private String vendorStoreName;
    private BigDecimal amount;
    private String currencyCode;
    private PayoutStatus status;
    private String bankAccountNumber;
    private String bankAccountHolderName;
    private String bankIfscCode;
    private String bankName;
    private String utrNumber;
    private String adminNotes;
    private String rejectionReason;
    private Instant requestedAt;
    private Instant approvedAt;
    private Instant processedAt;
}
