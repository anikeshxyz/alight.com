package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.MarketplaceCommissionInvoice;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionInvoiceDTO {

    private UUID id;
    private String invoiceNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private int periodMonth;
    private int periodYear;
    private BigDecimal grossSales;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal gstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalInvoiceAmount;
    private String sacCode;
    private String status;
    private String invoiceUrl;
    private Instant createdAt;

    public static CommissionInvoiceDTO fromEntity(MarketplaceCommissionInvoice inv) {
        String storeName = inv.getVendor() != null ? inv.getVendor().getStoreName() : null;
        return CommissionInvoiceDTO.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .vendorId(inv.getVendor() != null ? inv.getVendor().getId() : null)
                .vendorStoreName(storeName)
                .periodMonth(inv.getPeriodMonth())
                .periodYear(inv.getPeriodYear())
                .grossSales(inv.getGrossSales())
                .commissionRate(inv.getCommissionRate())
                .commissionAmount(inv.getCommissionAmount())
                .gstRate(inv.getGstRate())
                .cgstAmount(inv.getCgstAmount())
                .sgstAmount(inv.getSgstAmount())
                .igstAmount(inv.getIgstAmount())
                .totalInvoiceAmount(inv.getTotalInvoiceAmount())
                .sacCode(inv.getSacCode())
                .status(inv.getStatus())
                .invoiceUrl(inv.getInvoiceUrl())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
