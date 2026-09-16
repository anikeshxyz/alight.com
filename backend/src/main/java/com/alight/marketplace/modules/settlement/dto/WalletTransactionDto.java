package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.WalletTransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransactionDto {
    private UUID id;
    private UUID walletId;
    private UUID vendorId;
    private UUID vendorOrderId;
    private String subOrderNumber;
    private UUID payoutId;
    private WalletTransactionType transactionType;
    private BigDecimal amount;
    private String balanceType;
    private BigDecimal balanceAfter;
    private String description;
    private String referenceId;
    private Instant createdAt;
}
