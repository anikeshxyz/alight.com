package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.modules.product.dto.ProductDetailDto;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ProductService {

    Page<ProductSummaryDto> searchProducts(
            String categoryIdentifier,
            UUID brandId,
            UUID vendorId,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStockOnly,
            Pageable pageable
    );

    ProductDetailDto getProductBySlug(String slug);

    List<ProductSummaryDto> getFeaturedProducts(int limit);

    List<ProductSummaryDto> getRelatedProducts(String slug, int limit);
}
