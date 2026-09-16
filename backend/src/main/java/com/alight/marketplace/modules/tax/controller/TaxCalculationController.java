package com.alight.marketplace.modules.tax.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.dto.TaxCategoryDto;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import com.alight.marketplace.modules.tax.service.TaxManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/taxes")
@RequiredArgsConstructor
public class TaxCalculationController {

    private final TaxCalculationService taxCalculationService;
    private final TaxManagementService taxManagementService;

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<TaxCalculationResponse>> calculateTax(
            @Valid @RequestBody TaxCalculationRequest request) {
        TaxCalculationResponse response = taxCalculationService.calculateTax(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tax calculated successfully"));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<TaxCategoryDto>>> getActiveCategories() {
        List<TaxCategoryDto> categories = taxManagementService.getAllActiveTaxCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Active tax categories retrieved"));
    }
}
