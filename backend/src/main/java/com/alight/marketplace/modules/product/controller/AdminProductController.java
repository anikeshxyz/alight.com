package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductStatusRequest;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.service.AdminProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@Tag(name = "Admin Product Moderation", description = "Administrative catalog review, approvals, rejections, and featured flags")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    @Operation(summary = "List all products (Admin)", description = "Returns a paginated list of all products across vendors with status and category filters")
    public ResponseEntity<ApiResponse<Page<ProductResponseDto>>> listAllProducts(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ProductResponseDto> products = adminProductService.listAllProducts(status, categoryId, vendorId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID (Admin)", description = "Retrieves full product details for review")
    public ResponseEntity<ApiResponse<ProductResponseDto>> getProductById(@PathVariable UUID id) {
        ProductResponseDto product = adminProductService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update product status (Admin)", description = "Approves (ACTIVE), rejects with reason, or deactivates a product")
    public ResponseEntity<ApiResponse<ProductResponseDto>> updateProductStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        ProductResponseDto updated = adminProductService.updateProductStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product status updated to " + request.getStatus()));
    }

    @PutMapping("/{id}/featured")
    @Operation(summary = "Toggle featured product (Admin)", description = "Sets whether the product is promoted as a featured item")
    public ResponseEntity<ApiResponse<ProductResponseDto>> toggleFeatured(
            @PathVariable UUID id,
            @RequestParam boolean featured
    ) {
        ProductResponseDto updated = adminProductService.toggleFeatured(id, featured);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product featured flag updated to " + featured));
    }
}
