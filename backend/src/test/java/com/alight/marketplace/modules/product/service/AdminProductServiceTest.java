package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductStatusRequest;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.impl.AdminProductServiceImpl;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Spy
    private ProductMapper productMapper = new ProductMapper(new CategoryMapper(), new BrandMapper(), new VendorMapper());

    @InjectMocks
    private AdminProductServiceImpl adminProductService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id(UUID.randomUUID())
                .title("Smart Fitness Tracker")
                .slug("smart-fitness-tracker")
                .basePrice(new BigDecimal("79.99"))
                .sku("FIT-TRACK-01")
                .status(ProductStatus.PENDING_APPROVAL)
                .featured(false)
                .build();
    }

    @Test
    @DisplayName("Should approve product and set status to ACTIVE")
    void testApproveProduct() {
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProductStatusRequest request = UpdateProductStatusRequest.builder()
                .status(ProductStatus.ACTIVE)
                .build();

        ProductResponseDto result = adminProductService.updateProductStatus(product.getId(), request);

        assertNotNull(result);
        assertEquals(ProductStatus.ACTIVE, result.getStatus());
        assertNull(result.getRejectionReason());
    }

    @Test
    @DisplayName("Should reject product with reason")
    void testRejectProductWithReason() {
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProductStatusRequest request = UpdateProductStatusRequest.builder()
                .status(ProductStatus.REJECTED)
                .rejectionReason("Misleading product title")
                .build();

        ProductResponseDto result = adminProductService.updateProductStatus(product.getId(), request);

        assertNotNull(result);
        assertEquals(ProductStatus.REJECTED, result.getStatus());
        assertEquals("Misleading product title", result.getRejectionReason());
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when rejecting without reason")
    void testRejectProductWithoutReason() {
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        UpdateProductStatusRequest request = UpdateProductStatusRequest.builder()
                .status(ProductStatus.REJECTED)
                .rejectionReason("   ")
                .build();

        assertThrows(BusinessRuleException.class, () ->
                adminProductService.updateProductStatus(product.getId(), request)
        );
    }
}
