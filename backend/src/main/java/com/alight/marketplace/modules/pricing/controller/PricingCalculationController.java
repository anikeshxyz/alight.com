package com.alight.marketplace.modules.pricing.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/pricing")
@RequiredArgsConstructor
public class PricingCalculationController {

    private final PricingService pricingService;

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<PriceCalculationResponse>> calculatePrice(
            @Valid @RequestBody PriceCalculationRequest request) {
        PriceCalculationResponse response = pricingService.calculatePrice(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Price calculated successfully"));
    }
}
