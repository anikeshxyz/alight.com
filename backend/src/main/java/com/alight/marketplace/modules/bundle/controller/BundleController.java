package com.alight.marketplace.modules.bundle.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.bundle.dto.BundleDto;
import com.alight.marketplace.modules.bundle.dto.BundleSummaryDto;
import com.alight.marketplace.modules.bundle.service.BundleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bundles")
@RequiredArgsConstructor
@Tag(name = "Product Bundles", description = "Public product bundle browsing and discovery")
public class BundleController {

    private final BundleService bundleService;

    @GetMapping
    @Operation(summary = "List all active product bundles")
    public ResponseEntity<ApiResponse<Page<BundleSummaryDto>>> getActiveBundles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Page<BundleSummaryDto> bundles = bundleService.getActiveBundles(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success(bundles));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get bundle details by slug")
    public ResponseEntity<ApiResponse<BundleDto>> getBundleBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(bundleService.getBundleBySlug(slug)));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get bundles that contain a specific product")
    public ResponseEntity<ApiResponse<List<BundleSummaryDto>>> getBundlesForProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(bundleService.getBundlesContainingProduct(productId)));
    }
}
