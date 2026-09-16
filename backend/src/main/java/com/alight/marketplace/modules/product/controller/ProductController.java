package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.product.dto.ProductDetailDto;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product Catalog", description = "Public product browsing, faceted search, category filtering, and product details")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Search & filter products", description = "Returns active products matching category, brand, vendor, price range, stock, or keyword search")
    public ResponseEntity<ApiResponse<Page<ProductSummaryDto>>> searchProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        String effectiveCategory = (category != null && !category.isBlank()) ? category : categoryId;
        String effectiveSearch = (search != null && !search.isBlank()) ? search : q;

        Page<ProductSummaryDto> results = productService.searchProducts(
                effectiveCategory, brandId, vendorId, effectiveSearch, minPrice, maxPrice, inStock, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get product by slug", description = "Returns full product details, gallery, specifications, and SKU variants")
    public ResponseEntity<ApiResponse<ProductDetailDto>> getProductBySlug(@PathVariable String slug) {
        ProductDetailDto product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured products", description = "Returns curated featured products for home & discovery displays")
    public ResponseEntity<ApiResponse<List<ProductSummaryDto>>> getFeaturedProducts(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<ProductSummaryDto> featured = productService.getFeaturedProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(featured));
    }

    @GetMapping("/{slug}/related")
    @Operation(summary = "Get related products", description = "Returns similar products within the same category")
    public ResponseEntity<ApiResponse<List<ProductSummaryDto>>> getRelatedProducts(
            @PathVariable String slug,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<ProductSummaryDto> related = productService.getRelatedProducts(slug, limit);
        return ResponseEntity.ok(ApiResponse.success(related));
    }
}
