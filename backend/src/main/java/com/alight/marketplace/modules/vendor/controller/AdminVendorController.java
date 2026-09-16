package com.alight.marketplace.modules.vendor.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.vendor.dto.UpdateCommissionRequest;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/vendors")
@RequiredArgsConstructor
@Tag(name = "Admin Vendor Management", description = "Administrative endpoints for vendor applications review, approval, and commissions")
public class AdminVendorController {

    private final AdminVendorService adminVendorService;

    @GetMapping
    @Operation(summary = "List all vendors (Admin)", description = "Returns a paginated list of vendor accounts with status filter and search")
    public ResponseEntity<ApiResponse<Page<VendorResponseDto>>> listVendors(
            @RequestParam(required = false) VendorStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<VendorResponseDto> vendors = adminVendorService.listVendors(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(vendors));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vendor details (Admin)", description = "Returns complete vendor profile including KYC, bank details, and pickup locations")
    public ResponseEntity<ApiResponse<VendorResponseDto>> getVendorById(@PathVariable UUID id) {
        VendorResponseDto vendor = adminVendorService.getVendorById(id);
        return ResponseEntity.ok(ApiResponse.success(vendor));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update vendor status (Admin)", description = "Approves, rejects, or suspends a vendor account. Approving automatically grants ROLE_VENDOR.")
    public ResponseEntity<ApiResponse<VendorResponseDto>> updateVendorStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVendorStatusRequest request
    ) {
        VendorResponseDto updated = adminVendorService.updateVendorStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Vendor status updated to " + request.getStatus()));
    }

    @PutMapping("/{id}/commission")
    @Operation(summary = "Update vendor commission (Admin)", description = "Sets the platform commission percentage for this specific vendor")
    public ResponseEntity<ApiResponse<VendorResponseDto>> updateCommission(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommissionRequest request
    ) {
        VendorResponseDto updated = adminVendorService.updateCommission(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Vendor commission rate updated"));
    }
}
