package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductRequest;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface VendorProductService {

    Page<ProductResponseDto> getVendorProducts(String userEmail, ProductStatus status, Pageable pageable);

    ProductResponseDto getVendorProductById(String userEmail, UUID productId);

    ProductResponseDto createProduct(String userEmail, CreateProductRequest request);

    ProductResponseDto updateProduct(String userEmail, UUID productId, UpdateProductRequest request);

    ProductResponseDto submitProductForReview(String userEmail, UUID productId);

    void deleteProduct(String userEmail, UUID productId);
}
