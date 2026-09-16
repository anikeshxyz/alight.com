package com.alight.marketplace.modules.tax.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.tax.dto.TaxCategoryDto;
import com.alight.marketplace.modules.tax.service.TaxManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/taxes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaxController {

    private final TaxManagementService taxManagementService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<TaxCategoryDto>>> listAllCategories() {
        List<TaxCategoryDto> categories = taxManagementService.listAllCategoriesAdmin();
        return ResponseEntity.ok(ApiResponse.success(categories, "All tax categories retrieved"));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<TaxCategoryDto>> createCategory(
            @Valid @RequestBody TaxCategoryDto dto) {
        TaxCategoryDto created = taxManagementService.createCategory(dto);
        return ResponseEntity.ok(ApiResponse.success(created, "Tax category created successfully"));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<TaxCategoryDto>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody TaxCategoryDto dto) {
        TaxCategoryDto updated = taxManagementService.updateCategory(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Tax category updated successfully"));
    }
}
