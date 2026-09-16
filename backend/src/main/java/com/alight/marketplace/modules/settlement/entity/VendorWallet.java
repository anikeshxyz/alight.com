package com.alight.marketplace.modules.settlement.entity;

import com.alight.marketplace.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vendor_wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

    @Column(name = "pending_balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal pendingBalance = BigDecimal.ZERO;

    @Column(name = "available_balance", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "reserved_balance", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal reservedBalance = BigDecimal.ZERO;

    @Column(name = "on_hold_balance", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal onHoldBalance = BigDecimal.ZERO;

    @Column(name = "recovery_due_balance", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal recoveryDueBalance = BigDecimal.ZERO;

    @Column(name = "total_earnings", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "total_withdrawn", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalWithdrawn = BigDecimal.ZERO;

    @Column(name = "total_commission_paid", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalCommissionPaid = BigDecimal.ZERO;

    @Column(name = "total_tcs_paid", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalTcsPaid = BigDecimal.ZERO;

    @Column(name = "currency_code", nullable = false, length = 10)
    @Builder.Default
    private String currencyCode = "INR";

    @Column(name = "bank_account_number", length = 60)
    private String bankAccountNumber;

    @Column(name = "bank_account_holder_name", length = 150)
    private String bankAccountHolderName;

    @Column(name = "bank_ifsc_code", length = 20)
    private String bankIfscCode;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_branch", length = 100)
    private String bankBranch;

    @Column(name = "is_payout_enabled", nullable = false)
    @Builder.Default
    private Boolean isPayoutEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
