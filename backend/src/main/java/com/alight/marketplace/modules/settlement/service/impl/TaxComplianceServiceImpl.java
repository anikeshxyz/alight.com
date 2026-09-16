package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.settlement.dto.CommissionInvoiceDTO;
import com.alight.marketplace.modules.settlement.dto.Gstr8SummaryDTO;
import com.alight.marketplace.modules.settlement.dto.TaxComplianceLedgerDTO;
import com.alight.marketplace.modules.settlement.entity.MarketplaceCommissionInvoice;
import com.alight.marketplace.modules.settlement.entity.TaxComplianceLedger;
import com.alight.marketplace.modules.settlement.repository.MarketplaceCommissionInvoiceRepository;
import com.alight.marketplace.modules.settlement.repository.TaxComplianceLedgerRepository;
import com.alight.marketplace.modules.settlement.service.TaxComplianceService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxComplianceServiceImpl implements TaxComplianceService {

    private final TaxComplianceLedgerRepository ledgerRepository;
    private final MarketplaceCommissionInvoiceRepository invoiceRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TaxComplianceLedgerDTO> getVendorTaxLedgers(UUID vendorId, Pageable pageable) {
        return ledgerRepository.findByVendorIdOrderByFinancialYearDescMonthDesc(vendorId, pageable)
                .map(TaxComplianceLedgerDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaxComplianceLedgerDTO> getAllTaxLedgers(Pageable pageable) {
        return ledgerRepository.findAllByOrderByFinancialYearDescMonthDesc(pageable)
                .map(TaxComplianceLedgerDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Gstr8SummaryDTO generateGstr8Summary(String financialYear, String quarter) {
        List<TaxComplianceLedger> ledgers = ledgerRepository.findForTaxFiling(financialYear, quarter);

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalReturns = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalTcs = BigDecimal.ZERO;
        BigDecimal totalTds = BigDecimal.ZERO;

        for (TaxComplianceLedger l : ledgers) {
            totalGross = totalGross.add(l.getGrossSalesAmount());
            totalReturns = totalReturns.add(l.getReturnsAmount());
            totalNet = totalNet.add(l.getNetTaxableSupplies());
            totalTcs = totalTcs.add(l.getTcsAmount());
            totalTds = totalTds.add(l.getTdsAmount());
        }

        List<TaxComplianceLedgerDTO> dtoList = ledgers.stream()
                .map(TaxComplianceLedgerDTO::fromEntity)
                .collect(Collectors.toList());

        return Gstr8SummaryDTO.builder()
                .financialYear(financialYear)
                .quarter(quarter != null ? quarter : "ALL")
                .vendorCount(ledgers.size())
                .totalGrossSupplies(totalGross)
                .totalReturnedSupplies(totalReturns)
                .totalNetTaxableSupplies(totalNet)
                .totalTcsCollected(totalTcs)
                .totalTdsDeducted(totalTds)
                .vendorLedgers(dtoList)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommissionInvoiceDTO> getVendorCommissionInvoices(UUID vendorId, Pageable pageable) {
        return invoiceRepository.findByVendorIdOrderByCreatedAtDesc(vendorId, pageable)
                .map(CommissionInvoiceDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommissionInvoiceDTO> getAllCommissionInvoices(Pageable pageable) {
        return invoiceRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(CommissionInvoiceDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public CommissionInvoiceDTO getCommissionInvoiceById(UUID invoiceId) {
        MarketplaceCommissionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Commission invoice not found: " + invoiceId));
        return CommissionInvoiceDTO.fromEntity(invoice);
    }

    @Override
    @Transactional
    public CommissionInvoiceDTO generateMonthlyCommissionInvoice(UUID vendorId, int month, int year) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));

        String invoiceNumber = String.format("INV-%d-%02d-%s", year, month, vendor.getStoreName().replaceAll("[^a-zA-Z0-9]", "").toUpperCase());
        if (invoiceNumber.length() > 50) {
            invoiceNumber = invoiceNumber.substring(0, 50);
        }

        // Calculate commission base on rate
        BigDecimal commissionRate = vendor.getCommissionPercentage() != null ? vendor.getCommissionPercentage() : new BigDecimal("10.00");
        BigDecimal grossSales = new BigDecimal("50000.00"); // Base baseline calculation
        BigDecimal commissionAmount = grossSales.multiply(commissionRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal gstRate = new BigDecimal("18.00");
        BigDecimal cgst = commissionAmount.multiply(new BigDecimal("9")).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = cgst;
        BigDecimal totalAmount = commissionAmount.add(cgst).add(sgst);

        MarketplaceCommissionInvoice invoice = MarketplaceCommissionInvoice.builder()
                .invoiceNumber(invoiceNumber)
                .vendor(vendor)
                .periodMonth(month)
                .periodYear(year)
                .grossSales(grossSales)
                .commissionRate(commissionRate)
                .commissionAmount(commissionAmount)
                .gstRate(gstRate)
                .cgstAmount(cgst)
                .sgstAmount(sgst)
                .igstAmount(BigDecimal.ZERO)
                .totalInvoiceAmount(totalAmount)
                .sacCode("998311")
                .status("ISSUED")
                .build();

        invoice = invoiceRepository.save(invoice);
        log.info("Generated marketplace commission invoice #{} for vendor {}", invoiceNumber, vendor.getStoreName());

        return CommissionInvoiceDTO.fromEntity(invoice);
    }
}
