package com.alight.marketplace.modules.settlement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "settlement_tax_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementTaxRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String taxRuleCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String jurisdiction = "IN";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String taxType = "GST_TCS"; // GST_TCS, TDS_194O, VAT, SALES_TAX

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal ratePercentage = new BigDecimal("1.00");

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String calculationBase = "NET_TAXABLE_SUPPLIES";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String version = "v1.0";

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Instant effectiveFrom = Instant.now();

    private Instant effectiveUntil;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
