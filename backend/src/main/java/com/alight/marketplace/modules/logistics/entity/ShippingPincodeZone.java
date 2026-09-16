package com.alight.marketplace.modules.logistics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shipping_pincode_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingPincodeZone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 10)
    private String pincode;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(name = "zone_tier", nullable = false, length = 50)
    @Builder.Default
    private String zoneTier = "TIER_1";

    @Column(name = "is_prepaid_serviceable", nullable = false)
    @Builder.Default
    private boolean prepaidServiceable = true;

    @Column(name = "is_cod_serviceable", nullable = false)
    @Builder.Default
    private boolean codServiceable = true;

    @Column(name = "is_express_serviceable", nullable = false)
    @Builder.Default
    private boolean expressServiceable = true;

    @Column(name = "estimated_transit_days", nullable = false)
    @Builder.Default
    private int estimatedTransitDays = 3;

    @Column(name = "remote_surcharge", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal remoteSurcharge = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
