package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.settlement.dto.CommissionInvoiceDTO;
import com.alight.marketplace.modules.settlement.dto.Gstr8SummaryDTO;
import com.alight.marketplace.modules.settlement.dto.TaxComplianceLedgerDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TaxComplianceService {

    Page<TaxComplianceLedgerDTO> getVendorTaxLedgers(UUID vendorId, Pageable pageable);

    Page<TaxComplianceLedgerDTO> getAllTaxLedgers(Pageable pageable);

    Gstr8SummaryDTO generateGstr8Summary(String financialYear, String quarter);

    Page<CommissionInvoiceDTO> getVendorCommissionInvoices(UUID vendorId, Pageable pageable);

    Page<CommissionInvoiceDTO> getAllCommissionInvoices(Pageable pageable);

    CommissionInvoiceDTO getCommissionInvoiceById(UUID invoiceId);

    CommissionInvoiceDTO generateMonthlyCommissionInvoice(UUID vendorId, int month, int year);
}
