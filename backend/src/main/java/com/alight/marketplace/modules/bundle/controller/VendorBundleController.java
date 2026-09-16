package com.alight.marketplace.modules.bundle.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.bundle.dto.BundleDto;
import com.alight.marketplace.modules.bundle.dto.BundleSummaryDto;
import com.alight.marketplace.modules.bundle.dto.CreateBundleRequest;
import com.alight.marketplace.modules.bundle.service.BundleService;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/bundles")
@RequiredArgsConstructor
@Tag(name = "Vendor Bundle Management", description = "Vendor product bundle creation and management")
public class VendorBundleController {

    private final BundleService bundleService;
    private final VendorRepository vendorRepository;

    private UUID getVendorId(Principal principal) {
        if (principal == null) throw new UnauthorizedException("Vendor authentication required");
        return vendorRepository.findByUserEmail(principal.getName())
                .orElseThrow(() -> new UnauthorizedException("Vendor profile not found"))
                .getId();
    }

    @GetMapping
    @Operation(summary = "List vendor's own product bundles")
    public ResponseEntity<ApiResponse<Page<BundleSummaryDto>>> getMyBundles(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        UUID vendorId = getVendorId(principal);
        return ResponseEntity.ok(ApiResponse.success(
                bundleService.getVendorBundles(vendorId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @PostMapping
    @Operation(summary = "Create a new bundle from vendor's products")
    public ResponseEntity<ApiResponse<BundleDto>> createBundle(
            Principal principal,
            @Valid @RequestBody CreateBundleRequest request
    ) {
        UUID vendorId = getVendorId(principal);
        BundleDto bundle = bundleService.createBundle(request, principal.getName(), vendorId);
        return new ResponseEntity<>(ApiResponse.success(bundle, "Bundle created successfully"), HttpStatus.CREATED);
    }
}
