package com.alight.marketplace.modules.bundle.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.bundle.dto.BundleDto;
import com.alight.marketplace.modules.bundle.dto.BundleSummaryDto;
import com.alight.marketplace.modules.bundle.dto.CreateBundleRequest;
import com.alight.marketplace.modules.bundle.entity.BundleStatus;
import com.alight.marketplace.modules.bundle.service.BundleService;
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
@RequestMapping("/api/v1/admin/bundles")
@RequiredArgsConstructor
@Tag(name = "Admin Bundle Management", description = "Admin CRUD operations for product bundles")
public class AdminBundleController {

    private final BundleService bundleService;

    @GetMapping
    @Operation(summary = "List all bundles (all statuses)")
    public ResponseEntity<ApiResponse<Page<BundleSummaryDto>>> getAllBundles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                bundleService.getAllBundlesAdmin(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @PostMapping
    @Operation(summary = "Create a new product bundle")
    public ResponseEntity<ApiResponse<BundleDto>> createBundle(
            Principal principal,
            @Valid @RequestBody CreateBundleRequest request
    ) {
        if (principal == null) throw new UnauthorizedException("Admin authentication required");
        BundleDto bundle = bundleService.createBundle(request, principal.getName(), null);
        return new ResponseEntity<>(ApiResponse.success(bundle, "Bundle created successfully"), HttpStatus.CREATED);
    }

    @PatchMapping("/{bundleId}/status")
    @Operation(summary = "Publish or archive a bundle")
    public ResponseEntity<ApiResponse<BundleDto>> updateStatus(
            Principal principal,
            @PathVariable UUID bundleId,
            @RequestParam String status
    ) {
        if (principal == null) throw new UnauthorizedException("Admin authentication required");
        BundleStatus newStatus = BundleStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(bundleService.updateBundleStatus(bundleId, newStatus, principal.getName()),
                "Bundle status updated to " + newStatus));
    }
}
