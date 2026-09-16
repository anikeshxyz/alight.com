package com.alight.marketplace.modules.product.service;

import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.category.repository.BrandRepository;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductAttributeRepository;
import com.alight.marketplace.modules.product.repository.ProductImageRepository;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.product.service.impl.VendorProductServiceImpl;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
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
class VendorProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository imageRepository;

    @Mock
    private ProductAttributeRepository attributeRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BrandRepository brandRepository;

    @Spy
    private ProductMapper productMapper = new ProductMapper(new CategoryMapper(), new BrandMapper(), new VendorMapper());

    @InjectMocks
    private VendorProductServiceImpl vendorProductService;

    private Vendor approvedVendor;
    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        approvedVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Apex Store")
                .slug("apex-store")
                .status(VendorStatus.APPROVED)
                .build();

        category = Category.builder()
                .id(UUID.randomUUID())
                .name("Monitors")
                .slug("monitors")
                .build();

        product = Product.builder()
                .id(UUID.randomUUID())
                .vendor(approvedVendor)
                .category(category)
                .title("4K Gaming Monitor 27-inch")
                .slug("4k-gaming-monitor-27-inch")
                .basePrice(new BigDecimal("399.99"))
                .sku("MON-4K-27")
                .stockQuantity(25)
                .status(ProductStatus.PENDING_APPROVAL)
                .build();
    }

    @Test
    @DisplayName("Should create product as PENDING_APPROVAL for approved vendor")
    void testCreateProductSuccess() {
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("4K Gaming Monitor 27-inch")
                .basePrice(new BigDecimal("399.99"))
                .sku("MON-4K-27")
                .stockQuantity(25)
                .build();

        when(vendorRepository.findByUserEmail("vendor@alight.com")).thenReturn(Optional.of(approvedVendor));
        when(categoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        when(productRepository.existsBySku("MON-4K-27")).thenReturn(false);
        when(productRepository.existsBySlug("4k-gaming-monitor-27-inch")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponseDto result = vendorProductService.createProduct("vendor@alight.com", request);

        assertNotNull(result);
        assertEquals("4K Gaming Monitor 27-inch", result.getTitle());
        assertEquals(ProductStatus.PENDING_APPROVAL, result.getStatus());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on duplicate SKU")
    void testCreateProductDuplicateSku() {
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("4K Gaming Monitor 27-inch")
                .sku("MON-4K-27")
                .basePrice(new BigDecimal("399.99"))
                .build();

        when(vendorRepository.findByUserEmail("vendor@alight.com")).thenReturn(Optional.of(approvedVendor));
        when(productRepository.existsBySku("MON-4K-27")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                vendorProductService.createProduct("vendor@alight.com", request)
        );
    }
}
