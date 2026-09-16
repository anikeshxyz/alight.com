package com.alight.marketplace.modules.category.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category Management", description = "Public category navigation, subcategory discovery, and hierarchy")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/tree")
    @Operation(summary = "Get public category tree", description = "Returns full hierarchical tree of active categories for storefront navigation")
    public ResponseEntity<ApiResponse<List<CategoryTreeDto>>> getCategoryTree() {
        List<CategoryTreeDto> tree = categoryService.getPublicCategoryTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping("/{parentId}/subcategories")
    @Operation(summary = "Get subcategories", description = "Returns active child categories belonging to the designated parent category")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getSubcategories(@PathVariable UUID parentId) {
        List<CategoryDto> subcategories = categoryService.getPublicSubcategories(parentId);
        return ResponseEntity.ok(ApiResponse.success(subcategories));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get category by slug", description = "Returns active category details by URL slug")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryBySlug(@PathVariable String slug) {
        CategoryDto category = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(category));
    }
}
