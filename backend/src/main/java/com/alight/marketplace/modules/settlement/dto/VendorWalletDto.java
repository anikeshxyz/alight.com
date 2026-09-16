package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorWalletDto {
    private UUID id;
    private UUID vendorId;
    private String vendorStoreName;
    private BigDecimal pendingBalance;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;
    private BigDecimal onHoldBalance;
    private BigDecimal recoveryDueBalance;
    private BigDecimal totalEarnings;
    private BigDecimal totalWithdrawn;
    private BigDecimal totalCommissionPaid;
    private BigDecimal totalTcsPaid;
    private String currencyCode;
    private String bankAccountNumber;
    private String bankAccountHolderName;
    private String bankIfscCode;
    private String bankName;
    private String bankBranch;
    private Boolean isPayoutEnabled;
    private Instant updatedAt;
}
