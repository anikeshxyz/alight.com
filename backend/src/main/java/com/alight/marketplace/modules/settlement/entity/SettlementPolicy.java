package com.alight.marketplace.modules.settlement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "settlement_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String policyName;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String scope = "MARKETPLACE_DEFAULT"; // MARKETPLACE_DEFAULT, CATEGORY, VENDOR, PRODUCT

    private UUID scopeId;

    @Column(nullable = false)
    @Builder.Default
    private Integer returnWindowDays = 7;

    @Column(nullable = false)
    @Builder.Default
    private Boolean autoApprovalEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean holdDisputedOrders = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer coolingPeriodHours = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
