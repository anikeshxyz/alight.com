package com.alight.marketplace.modules.logistics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shipping_rate_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingRateRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "zone_tier", nullable = false, length = 50)
    private String zoneTier;

    @Column(name = "shipping_mode", nullable = false, length = 50)
    @Builder.Default
    private String shippingMode = "STANDARD";

    @Column(name = "base_weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal baseWeightKg = new BigDecimal("0.50");

    @Column(name = "base_rate", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal baseRate = new BigDecimal("40.00");

    @Column(name = "incremental_weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal incrementalWeightKg = new BigDecimal("0.50");

    @Column(name = "incremental_rate", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal incrementalRate = new BigDecimal("30.00");

    @Column(name = "fuel_surcharge_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal fuelSurchargePercent = new BigDecimal("5.00");

    @Column(name = "insurance_fee_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal insuranceFeePercent = new BigDecimal("0.50");

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
