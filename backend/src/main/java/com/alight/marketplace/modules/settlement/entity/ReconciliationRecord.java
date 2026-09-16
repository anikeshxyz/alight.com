package com.alight.marketplace.modules.settlement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String recordReference;

    @Column(nullable = false, length = 50)
    private String reconciliationType; // GATEWAY_ESCROW, BANK_PAYOUT, LEDGER_AUDIT

    @Column(length = 120)
    private String externalReference;

    @Column(length = 120)
    private String ledgerReference;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal expectedAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal actualAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String status = "MATCHED"; // MATCHED, PARTIALLY_MATCHED, MISMATCH, MISSING_PROVIDER, MISSING_LEDGER

    @Column(columnDefinition = "TEXT")
    private String discrepancyReason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant reconciledAt;

    @Column(length = 150)
    private String reconciledBy;
}
