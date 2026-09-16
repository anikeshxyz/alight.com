package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.PayoutBatch;
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
public class PayoutBatchDTO {

    private UUID id;
    private String batchReference;
    private BigDecimal totalAmount;
    private String currencyCode;
    private int payoutCount;
    private PayoutStatus status;
    private String bankBatchId;
    private Instant processedAt;
    private String notes;
    private Instant createdAt;

    public static PayoutBatchDTO fromEntity(PayoutBatch batch) {
        return PayoutBatchDTO.builder()
                .id(batch.getId())
                .batchReference(batch.getBatchReference())
                .totalAmount(batch.getTotalAmount())
                .currencyCode(batch.getCurrencyCode())
                .payoutCount(batch.getPayoutCount())
                .status(batch.getStatus())
                .bankBatchId(batch.getBankBatchId())
                .processedAt(batch.getProcessedAt())
                .notes(batch.getNotes())
                .createdAt(batch.getCreatedAt())
                .build();
    }
}
