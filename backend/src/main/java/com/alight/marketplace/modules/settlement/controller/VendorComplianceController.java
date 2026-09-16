package com.alight.marketplace.modules.settlement.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.settlement.dto.CommissionInvoiceDTO;
import com.alight.marketplace.modules.settlement.dto.TaxComplianceLedgerDTO;
import com.alight.marketplace.modules.settlement.service.TaxComplianceService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/compliance")
@RequiredArgsConstructor
@Tag(name = "Vendor Tax Compliance", description = "Seller access to TDS certificates, TCS ledgers, and platform GST invoices")
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
public class VendorComplianceController {

    private final TaxComplianceService taxComplianceService;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    @GetMapping("/ledgers")
    @Operation(summary = "Get vendor's tax compliance ledgers (TCS/TDS breakdown)")
    public ResponseEntity<ApiResponse<Page<TaxComplianceLedgerDTO>>> getVendorTaxLedgers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "financialYear", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID vendorId = resolveVendorId(userDetails);
        Page<TaxComplianceLedgerDTO> ledgers = taxComplianceService.getVendorTaxLedgers(vendorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(ledgers, "Vendor tax ledgers retrieved successfully"));
    }

    @GetMapping("/invoices")
    @Operation(summary = "Get vendor's monthly commission GST fee invoices")
    public ResponseEntity<ApiResponse<Page<CommissionInvoiceDTO>>> getVendorCommissionInvoices(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID vendorId = resolveVendorId(userDetails);
        Page<CommissionInvoiceDTO> invoices = taxComplianceService.getVendorCommissionInvoices(vendorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(invoices, "Vendor commission invoices retrieved successfully"));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get specific commission invoice by ID")
    public ResponseEntity<ApiResponse<CommissionInvoiceDTO>> getInvoiceById(@PathVariable UUID id) {
        CommissionInvoiceDTO invoice = taxComplianceService.getCommissionInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice details retrieved successfully"));
    }

    private UUID resolveVendorId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found: " + userDetails.getUsername()));
        Vendor vendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Vendor profile not found for user: " + user.getId()));
        return vendor.getId();
    }
}
