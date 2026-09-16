package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductStatusRequest;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminProductService {

    Page<ProductResponseDto> listAllProducts(ProductStatus status, UUID categoryId, UUID vendorId, String search, Pageable pageable);

    ProductResponseDto getProductById(UUID productId);

    ProductResponseDto updateProductStatus(UUID productId, UpdateProductStatusRequest request);

    ProductResponseDto toggleFeatured(UUID productId, boolean featured);
}
