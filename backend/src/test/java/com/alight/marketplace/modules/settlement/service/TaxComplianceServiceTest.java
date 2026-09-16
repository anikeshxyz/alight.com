package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.settlement.dto.CommissionInvoiceDTO;
import com.alight.marketplace.modules.settlement.dto.Gstr8SummaryDTO;
import com.alight.marketplace.modules.settlement.dto.TaxComplianceLedgerDTO;
import com.alight.marketplace.modules.settlement.entity.MarketplaceCommissionInvoice;
import com.alight.marketplace.modules.settlement.entity.TaxComplianceLedger;
import com.alight.marketplace.modules.settlement.repository.MarketplaceCommissionInvoiceRepository;
import com.alight.marketplace.modules.settlement.repository.TaxComplianceLedgerRepository;
import com.alight.marketplace.modules.settlement.service.impl.TaxComplianceServiceImpl;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxComplianceServiceTest {

    @Mock
    private TaxComplianceLedgerRepository ledgerRepository;

    @Mock
    private MarketplaceCommissionInvoiceRepository invoiceRepository;

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private TaxComplianceServiceImpl taxComplianceService;

    private Vendor vendor;
    private UUID vendorId;

    @BeforeEach
    void setUp() {
        vendorId = UUID.randomUUID();
        vendor = Vendor.builder()
                .id(vendorId)
                .storeName("Apex Electronics")
                .commissionPercentage(new BigDecimal("8.00"))
                .build();
    }

    @Test
    @DisplayName("Should generate GSTR-8 tax summary report across vendor ledgers")
    void shouldGenerateGstr8Summary() {
        TaxComplianceLedger ledger = TaxComplianceLedger.builder()
                .id(UUID.randomUUID())
                .vendor(vendor)
                .financialYear("2025-2026")
                .quarter("Q4")
                .month(2)
                .grossSalesAmount(new BigDecimal("100000.00"))
                .returnsAmount(new BigDecimal("5000.00"))
                .netTaxableSupplies(new BigDecimal("95000.00"))
                .tcsAmount(new BigDecimal("950.00"))
                .tdsAmount(new BigDecimal("100.00"))
                .commissionAmount(new BigDecimal("8000.00"))
                .commissionGst(new BigDecimal("1440.00"))
                .netPayoutDisbursed(new BigDecimal("84510.00"))
                .build();

        when(ledgerRepository.findForTaxFiling("2025-2026", "Q4")).thenReturn(List.of(ledger));

        Gstr8SummaryDTO summary = taxComplianceService.generateGstr8Summary("2025-2026", "Q4");

        assertThat(summary).isNotNull();
        assertThat(summary.getFinancialYear()).isEqualTo("2025-2026");
        assertThat(summary.getVendorCount()).isEqualTo(1);
        assertThat(summary.getTotalGrossSupplies()).isEqualByComparingTo("100000.00");
        assertThat(summary.getTotalNetTaxableSupplies()).isEqualByComparingTo("95000.00");
        assertThat(summary.getTotalTcsCollected()).isEqualByComparingTo("950.00");
        assertThat(summary.getTotalTdsDeducted()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("Should generate monthly commission invoice with 18% GST calculation")
    void shouldGenerateCommissionInvoice() {
        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(invoiceRepository.save(any(MarketplaceCommissionInvoice.class))).thenAnswer(inv -> {
            MarketplaceCommissionInvoice i = inv.getArgument(0);
            i.setId(UUID.randomUUID());
            return i;
        });

        CommissionInvoiceDTO invoice = taxComplianceService.generateMonthlyCommissionInvoice(vendorId, 3, 2026);

        assertThat(invoice).isNotNull();
        assertThat(invoice.getVendorStoreName()).isEqualTo("Apex Electronics");
        assertThat(invoice.getSacCode()).isEqualTo("998311");
        assertThat(invoice.getGstRate()).isEqualByComparingTo("18.00");
        assertThat(invoice.getCommissionRate()).isEqualByComparingTo("8.00");
        verify(invoiceRepository).save(any(MarketplaceCommissionInvoice.class));
    }
}
