package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.product.dto.ProductDetailDto;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.impl.ProductServiceImpl;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Spy
    private ProductMapper productMapper = new ProductMapper(new CategoryMapper(), new BrandMapper(), new VendorMapper());

    @InjectMocks
    private ProductServiceImpl productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name("Audio")
                .slug("audio")
                .build();

        Vendor vendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Pro Audio Store")
                .slug("pro-audio-store")
                .build();

        sampleProduct = Product.builder()
                .id(UUID.randomUUID())
                .category(category)
                .vendor(vendor)
                .title("Wireless Noise-Cancelling Headphones")
                .slug("wireless-noise-cancelling-headphones")
                .shortDescription("High fidelity sound")
                .basePrice(new BigDecimal("199.99"))
                .sku("AUD-HEAD-001")
                .stockQuantity(50)
                .status(ProductStatus.ACTIVE)
                .featured(true)
                .build();
    }

    @Test
    @DisplayName("Should search active products with filters")
    void testSearchProducts() {
        Page<Product> page = new PageImpl<>(List.of(sampleProduct));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<ProductSummaryDto> result = productService.searchProducts(
                null, null, null, "headphones", null, null, true, PageRequest.of(0, 10)
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Wireless Noise-Cancelling Headphones", result.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Should get product detail by slug")
    void testGetProductBySlug() {
        when(productRepository.findBySlugAndStatus("wireless-noise-cancelling-headphones", ProductStatus.ACTIVE))
                .thenReturn(Optional.of(sampleProduct));

        ProductDetailDto detail = productService.getProductBySlug("wireless-noise-cancelling-headphones");

        assertNotNull(detail);
        assertEquals("Wireless Noise-Cancelling Headphones", detail.getTitle());
        assertEquals("AUD-HEAD-001", detail.getSku());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unknown slug")
    void testGetProductBySlugNotFound() {
        when(productRepository.findBySlugAndStatus("non-existent", ProductStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                productService.getProductBySlug("non-existent")
        );
    }
}
