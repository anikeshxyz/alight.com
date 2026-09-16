package com.alight.marketplace.modules.category.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.service.BrandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
@Tag(name = "Brand Directory", description = "Public brand profiles and brand discovery")
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    @Operation(summary = "List active brands", description = "Returns all active marketplace brands in alphabetical order")
    public ResponseEntity<ApiResponse<List<BrandDto>>> getActiveBrands() {
        List<BrandDto> brands = brandService.getActiveBrands();
        return ResponseEntity.ok(ApiResponse.success(brands));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get brand by slug", description = "Returns active brand profile details by slug")
    public ResponseEntity<ApiResponse<BrandDto>> getBrandBySlug(@PathVariable String slug) {
        BrandDto brand = brandService.getBrandBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(brand));
    }
}
