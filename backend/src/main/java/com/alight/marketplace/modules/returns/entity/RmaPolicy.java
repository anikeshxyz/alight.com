package com.alight.marketplace.modules.returns.entity;

import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rma_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Column(name = "policy_name", nullable = false, length = 150)
    private String policyName;

    @Column(name = "return_window_days", nullable = false)
    @Builder.Default
    private Integer returnWindowDays = 15;

    @Column(name = "is_returnable", nullable = false)
    @Builder.Default
    private Boolean isReturnable = true;

    @Column(name = "restocking_fee_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal restockingFeePercentage = BigDecimal.ZERO;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "allow_refund", nullable = false)
    @Builder.Default
    private Boolean allowRefund = true;

    @Column(name = "allow_replacement", nullable = false)
    @Builder.Default
    private Boolean allowReplacement = true;

    @Column(name = "allow_store_credit", nullable = false)
    @Builder.Default
    private Boolean allowStoreCredit = true;

    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
