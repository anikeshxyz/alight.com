package com.alight.marketplace.modules.category.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CreateBrandRequest;
import com.alight.marketplace.modules.category.dto.UpdateBrandRequest;
import com.alight.marketplace.modules.category.service.BrandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/brands")
@RequiredArgsConstructor
@Tag(name = "Admin Brand Management", description = "Administrative brand catalog CRUD")
public class AdminBrandController {

    private final BrandService brandService;

    @GetMapping
    @Operation(summary = "List brands with search (Admin)", description = "Returns a paginated list of brands with search query support")
    public ResponseEntity<ApiResponse<Page<BrandDto>>> listBrands(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<BrandDto> brands = brandService.searchBrandsAdmin(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(brands));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get brand by ID (Admin)", description = "Retrieves brand details")
    public ResponseEntity<ApiResponse<BrandDto>> getBrandById(@PathVariable UUID id) {
        BrandDto brand = brandService.getBrandById(id);
        return ResponseEntity.ok(ApiResponse.success(brand));
    }

    @PostMapping
    @Operation(summary = "Create brand (Admin)", description = "Registers a new brand")
    public ResponseEntity<ApiResponse<BrandDto>> createBrand(@Valid @RequestBody CreateBrandRequest request) {
        BrandDto created = brandService.createBrand(request);
        return new ResponseEntity<>(ApiResponse.success(created, "Brand created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update brand (Admin)", description = "Updates brand profile details or active state")
    public ResponseEntity<ApiResponse<BrandDto>> updateBrand(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBrandRequest request
    ) {
        BrandDto updated = brandService.updateBrand(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Brand updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete brand (Admin)", description = "Deletes a brand from marketplace")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable UUID id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok(ApiResponse.success("Brand deleted successfully"));
    }
}
