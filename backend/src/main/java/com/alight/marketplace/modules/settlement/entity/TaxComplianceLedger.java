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
@Table(name = "tax_compliance_ledgers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_vendor_tax_period", columnNames = {"vendor_id", "financial_year", "ledger_month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxComplianceLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "financial_year", nullable = false, length = 20)
    private String financialYear;

    @Column(nullable = false, length = 10)
    private String quarter;

    @Column(name = "ledger_month", nullable = false)
    private int month;

    @Column(name = "gross_sales_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal grossSalesAmount = BigDecimal.ZERO;

    @Column(name = "returns_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal returnsAmount = BigDecimal.ZERO;

    @Column(name = "net_taxable_supplies", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal netTaxableSupplies = BigDecimal.ZERO;

    @Column(name = "tcs_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tcsRate = new BigDecimal("1.00");

    @Column(name = "tcs_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tcsAmount = BigDecimal.ZERO;

    @Column(name = "tds_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tdsRate = new BigDecimal("0.10");

    @Column(name = "tds_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tdsAmount = BigDecimal.ZERO;

    @Column(name = "commission_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Column(name = "commission_gst", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal commissionGst = BigDecimal.ZERO;

    @Column(name = "net_payout_disbursed", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal netPayoutDisbursed = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "RECONCILED";

    @Column(name = "vendor_gstin", length = 30)
    private String vendorGstin;

    @Column(name = "vendor_pan", length = 20)
    private String vendorPan;

    @Column(name = "filed_at")
    private Instant filedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
