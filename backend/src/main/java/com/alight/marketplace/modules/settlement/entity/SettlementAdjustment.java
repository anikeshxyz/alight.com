package com.alight.marketplace.modules.settlement.entity;

import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "settlement_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String adjustmentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id")
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rma_id")
    private RmaRequest rma;

    @Column(nullable = false, length = 50)
    private String adjustmentType; // RETURN_REFUND, CHARGEBACK, PENALTY, REVERSAL, MANUAL_ADMIN, CORRECTION

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(length = 150)
    private String createdBy;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String status = "APPLIED";

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
