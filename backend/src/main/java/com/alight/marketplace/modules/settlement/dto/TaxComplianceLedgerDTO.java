package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.TaxComplianceLedger;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxComplianceLedgerDTO {

    private UUID id;
    private UUID vendorId;
    private String vendorStoreName;
    private String financialYear;
    private String quarter;
    private int month;
    private BigDecimal grossSalesAmount;
    private BigDecimal returnsAmount;
    private BigDecimal netTaxableSupplies;
    private BigDecimal tcsRate;
    private BigDecimal tcsAmount;
    private BigDecimal tdsRate;
    private BigDecimal tdsAmount;
    private BigDecimal commissionAmount;
    private BigDecimal commissionGst;
    private BigDecimal netPayoutDisbursed;
    private String status;
    private String vendorGstin;
    private String vendorPan;
    private Instant filedAt;
    private Instant createdAt;

    public static TaxComplianceLedgerDTO fromEntity(TaxComplianceLedger ledger) {
        String storeName = ledger.getVendor() != null ? ledger.getVendor().getStoreName() : null;
        return TaxComplianceLedgerDTO.builder()
                .id(ledger.getId())
                .vendorId(ledger.getVendor() != null ? ledger.getVendor().getId() : null)
                .vendorStoreName(storeName)
                .financialYear(ledger.getFinancialYear())
                .quarter(ledger.getQuarter())
                .month(ledger.getMonth())
                .grossSalesAmount(ledger.getGrossSalesAmount())
                .returnsAmount(ledger.getReturnsAmount())
                .netTaxableSupplies(ledger.getNetTaxableSupplies())
                .tcsRate(ledger.getTcsRate())
                .tcsAmount(ledger.getTcsAmount())
                .tdsRate(ledger.getTdsRate())
                .tdsAmount(ledger.getTdsAmount())
                .commissionAmount(ledger.getCommissionAmount())
                .commissionGst(ledger.getCommissionGst())
                .netPayoutDisbursed(ledger.getNetPayoutDisbursed())
                .status(ledger.getStatus())
                .vendorGstin(ledger.getVendorGstin())
                .vendorPan(ledger.getVendorPan())
                .filedAt(ledger.getFiledAt())
                .createdAt(ledger.getCreatedAt())
                .build();
    }
}
