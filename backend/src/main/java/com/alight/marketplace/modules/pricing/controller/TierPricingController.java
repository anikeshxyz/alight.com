package com.alight.marketplace.modules.pricing.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.pricing.dto.CreateTierPriceRequest;
import com.alight.marketplace.modules.pricing.dto.ProductTierPriceDto;
import com.alight.marketplace.modules.pricing.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/tier-prices")
@RequiredArgsConstructor
public class TierPricingController {

    private final PricingService pricingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductTierPriceDto>>> getProductTiers(
            @PathVariable UUID productId) {
        List<ProductTierPriceDto> tiers = pricingService.getProductTiers(productId);
        return ResponseEntity.ok(ApiResponse.success(tiers, "Product tier prices retrieved"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProductTierPriceDto>> createTierPrice(
            @PathVariable UUID productId,
            @Valid @RequestBody CreateTierPriceRequest request) {
        ProductTierPriceDto created = pricingService.createTierPrice(productId, request);
        return ResponseEntity.ok(ApiResponse.success(created, "Tier price created successfully"));
    }

    @DeleteMapping("/{tierId}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTierPrice(
            @PathVariable UUID productId,
            @PathVariable UUID tierId) {
        pricingService.deleteTierPrice(tierId);
        return ResponseEntity.ok(ApiResponse.success(null, "Tier price deleted successfully"));
    }
}
