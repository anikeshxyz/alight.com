package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductRequest;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.service.VendorProductService;
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

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/products")
@RequiredArgsConstructor
@Tag(name = "Vendor Product Management", description = "Seller portal endpoints for product catalog creation, draft management, and SKU variants")
public class VendorProductController {

    private final VendorProductService vendorProductService;

    private String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to manage vendor products");
        }
        return principal.getName();
    }

    @GetMapping
    @Operation(summary = "List vendor products", description = "Returns a paginated list of products created by the authenticated vendor")
    public ResponseEntity<ApiResponse<Page<ProductResponseDto>>> getVendorProducts(
            Principal principal,
            @RequestParam(required = false) ProductStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        String email = getAuthenticatedEmail(principal);
        Page<ProductResponseDto> products = vendorProductService.getVendorProducts(email, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vendor product by ID", description = "Retrieves complete product details for editing")
    public ResponseEntity<ApiResponse<ProductResponseDto>> getVendorProductById(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        ProductResponseDto product = vendorProductService.getVendorProductById(email, id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    @Operation(summary = "Create product (Vendor)", description = "Creates a new product with images, attributes, and SKU variants")
    public ResponseEntity<ApiResponse<ProductResponseDto>> createProduct(
            Principal principal,
            @Valid @RequestBody CreateProductRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        ProductResponseDto created = vendorProductService.createProduct(email, request);
        return new ResponseEntity<>(ApiResponse.success(created, "Product created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product (Vendor)", description = "Updates an existing product in your catalog")
    public ResponseEntity<ApiResponse<ProductResponseDto>> updateProduct(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        ProductResponseDto updated = vendorProductService.updateProduct(email, id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @PutMapping("/{id}/submit")
    @Operation(summary = "Submit product for review (Vendor)", description = "Submits a draft or rejected product for admin approval")
    public ResponseEntity<ApiResponse<ProductResponseDto>> submitProductForReview(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        ProductResponseDto submitted = vendorProductService.submitProductForReview(email, id);
        return ResponseEntity.ok(ApiResponse.success(submitted, "Product submitted for review"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product (Vendor)", description = "Deletes a product from your catalog")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        vendorProductService.deleteProduct(email, id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully"));
    }
}
