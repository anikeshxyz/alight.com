package com.alight.marketplace.modules.settlement.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.settlement.dto.CommissionInvoiceDTO;
import com.alight.marketplace.modules.settlement.dto.Gstr8SummaryDTO;
import com.alight.marketplace.modules.settlement.dto.TaxComplianceLedgerDTO;
import com.alight.marketplace.modules.settlement.service.TaxComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/compliance")
@RequiredArgsConstructor
@Tag(name = "Admin Tax Compliance", description = "Statutory GST TCS, TDS 194O, and marketplace commission invoice management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplianceController {

    private final TaxComplianceService taxComplianceService;

    @GetMapping("/ledgers")
    @Operation(summary = "Get all vendor tax compliance ledgers with pagination")
    public ResponseEntity<ApiResponse<Page<TaxComplianceLedgerDTO>>> getAllTaxLedgers(
            @PageableDefault(size = 20, sort = "financialYear", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<TaxComplianceLedgerDTO> ledgers = taxComplianceService.getAllTaxLedgers(pageable);
        return ResponseEntity.ok(ApiResponse.success(ledgers, "Tax ledgers retrieved successfully"));
    }

    @GetMapping("/gstr8")
    @Operation(summary = "Generate GSTR-8 tax filing summary for e-commerce operators")
    public ResponseEntity<ApiResponse<Gstr8SummaryDTO>> getGstr8Summary(
            @RequestParam(defaultValue = "2025-2026") String financialYear,
            @RequestParam(required = false) String quarter
    ) {
        Gstr8SummaryDTO summary = taxComplianceService.generateGstr8Summary(financialYear, quarter);
        return ResponseEntity.ok(ApiResponse.success(summary, "GSTR-8 summary generated successfully"));
    }

    @GetMapping("/invoices")
    @Operation(summary = "Get all marketplace commission fee invoices")
    public ResponseEntity<ApiResponse<Page<CommissionInvoiceDTO>>> getAllInvoices(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CommissionInvoiceDTO> invoices = taxComplianceService.getAllCommissionInvoices(pageable);
        return ResponseEntity.ok(ApiResponse.success(invoices, "Commission invoices retrieved successfully"));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get specific commission invoice details")
    public ResponseEntity<ApiResponse<CommissionInvoiceDTO>> getInvoiceById(@PathVariable UUID id) {
        CommissionInvoiceDTO invoice = taxComplianceService.getCommissionInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice details retrieved successfully"));
    }

    @PostMapping("/invoices/generate")
    @Operation(summary = "Generate commission invoice for a vendor for specified month/year")
    public ResponseEntity<ApiResponse<CommissionInvoiceDTO>> generateInvoice(
            @RequestParam UUID vendorId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        CommissionInvoiceDTO invoice = taxComplianceService.generateMonthlyCommissionInvoice(vendorId, month, year);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Commission invoice generated successfully"));
    }
}
