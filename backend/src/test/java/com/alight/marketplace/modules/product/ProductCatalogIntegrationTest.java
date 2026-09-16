package com.alight.marketplace.modules.product;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.category.dto.*;
import com.alight.marketplace.modules.category.service.BrandService;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.product.dto.*;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.service.ProductService;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.vendor.dto.VendorApplicationRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.alight.marketplace.modules.vendor.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class ProductCatalogIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private BrandService brandService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private VendorProductService vendorProductService;

    @Autowired
    private ProductService productService;

    @Autowired
    private AuthService authService;

    private String vendorEmail;
    private CategoryDto rootCategory;
    private CategoryDto subCategory;
    private BrandDto brand;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        vendorEmail = "catalog_seller_" + suffix + "@alight.com";

        // 1. Register and approve vendor
        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("SecurePass123!")
                .firstName("Catalog")
                .lastName("Seller")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());

        VendorResponseDto vendorApp = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Apex Electronics " + suffix)
                .description("Next-gen gadgets and components")
                .supportEmail(vendorEmail)
                .supportPhone("+15558765432")
                .legalBusinessName("Apex Electronics Inc")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .taxIdGstin("27AAAAA1111A1Z5")
                .panNumber("ABCDE5678F")
                .bankAccountNumber("987654321098")
                .bankIfscCode("HDFC0005678")
                .bankName("HDFC Bank")
                .bankAccountHolderName("Apex Electronics Inc")
                .pickupContactPerson("Store Operations")
                .pickupContactPhone("+15558765432")
                .pickupAddressLine1("456 Tech Park")
                .pickupCity("Bangalore")
                .pickupState("Karnataka")
                .pickupPostalCode("560001")
                .pickupCountry("India")
                .build());

        adminVendorService.updateVendorStatus(vendorApp.getId(),
                com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest.builder()
                        .status(VendorStatus.APPROVED)
                        .build());

        // 2. Setup Category Hierarchy with commission override
        rootCategory = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Electronics " + suffix)
                .description("All consumer electronic devices")
                .commissionPercentage(new BigDecimal("8.50"))
                .displayOrder(1)
                .active(true)
                .build());

        subCategory = categoryService.createCategory(CreateCategoryRequest.builder()
                .parentId(rootCategory.getId())
                .name("Smartphones & Audio " + suffix)
                .description("Mobile phones, headphones, and earbuds")
                .commissionPercentage(new BigDecimal("6.00"))
                .displayOrder(1)
                .active(true)
                .build());

        // 3. Setup Brand
        brand = brandService.createBrand(CreateBrandRequest.builder()
                .name("AlightPro " + suffix)
                .websiteUrl("https://alightpro.com")
                .description("Flagship audio & smartphone accessories")
                .featured(true)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Should verify nested category hierarchy and category tree discovery")
    void testCategoryHierarchyTree() {
        List<CategoryTreeDto> tree = categoryService.getPublicCategoryTree();
        assertNotNull(tree);
        assertFalse(tree.isEmpty());

        CategoryTreeDto matchedRoot = tree.stream()
                .filter(c -> c.getId().equals(rootCategory.getId()))
                .findFirst()
                .orElse(null);

        assertNotNull(matchedRoot);
        assertNotNull(matchedRoot.getChildren());
        assertFalse(matchedRoot.getChildren().isEmpty());
        assertEquals(subCategory.getId(), matchedRoot.getChildren().get(0).getId());
    }

    @Test
    @DisplayName("Should create multi-variant product with tags, HSN codes, and SKU attributes")
    void testCreateMultiVariantProduct() {
        String sku = "APEX-EARBUD-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        CreateProductRequest createReq = CreateProductRequest.builder()
                .categoryId(subCategory.getId())
                .brandId(brand.getId())
                .title("Apex True Wireless ANC Earbuds")
                .shortDescription("Active noise cancellation with 40-hour battery life")
                .description("Full detailed product description with specs and warranty information.")
                .basePrice(new BigDecimal("129.99"))
                .discountPrice(new BigDecimal("99.99"))
                .sku(sku)
                .stockQuantity(150)
                .lowStockThreshold(15)
                .hsnCode("85183000")
                .tags("audio, earbuds, anc, wireless, bluetooth5.3")
                .images(List.of(
                        ProductImageDto.builder()
                                .imageUrl("https://cdn.alight.com/img/earbuds-main.jpg")
                                .altText("Apex Earbuds Front")
                                .primary(true)
                                .displayOrder(1)
                                .build()
                ))
                .attributes(List.of(
                        ProductAttributeDto.builder()
                                .attributeName("Connectivity")
                                .attributeValue("Bluetooth 5.3")
                                .displayOrder(1)
                                .build(),
                        ProductAttributeDto.builder()
                                .attributeName("Battery Life")
                                .attributeValue("40 Hours")
                                .displayOrder(2)
                                .build()
                ))
                .variants(List.of(
                        ProductVariantDto.builder()
                                .variantSku(sku + "-BLK")
                                .variantName("Midnight Black")
                                .price(new BigDecimal("99.99"))
                                .compareAtPrice(new BigDecimal("129.99"))
                                .stockQuantity(100)
                                .barcode("8901234567890")
                                .attributesJson("{\"color\": \"Midnight Black\"}")
                                .active(true)
                                .build(),
                        ProductVariantDto.builder()
                                .variantSku(sku + "-WHT")
                                .variantName("Polar White")
                                .price(new BigDecimal("99.99"))
                                .compareAtPrice(new BigDecimal("129.99"))
                                .stockQuantity(50)
                                .barcode("8901234567891")
                                .attributesJson("{\"color\": \"Polar White\"}")
                                .active(true)
                                .build()
                ))
                .build();

        ProductResponseDto product = vendorProductService.createProduct(vendorEmail, createReq);

        assertNotNull(product);
        assertNotNull(product.getId());
        assertEquals("Apex True Wireless ANC Earbuds", product.getTitle());
        assertEquals(ProductStatus.PENDING_APPROVAL, product.getStatus());
        assertEquals("85183000", product.getHsnCode());
        assertEquals(15, product.getLowStockThreshold());
        assertEquals(1, product.getImages().size());
        assertEquals(2, product.getAttributes().size());
        assertEquals(2, product.getVariants().size());

        // Verify variant mapping details
        ProductVariantDto blackVariant = product.getVariants().stream()
                .filter(v -> v.getVariantName().equals("Midnight Black"))
                .findFirst()
                .orElseThrow();
        assertEquals("8901234567890", blackVariant.getBarcode());
        assertEquals(new BigDecimal("129.99"), blackVariant.getCompareAtPrice());
    }

    @Test
    @DisplayName("Should verify vendor product updates and review submission lifecycle")
    void testProductUpdateAndReviewFlow() {
        String sku = "APEX-SMART-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        ProductResponseDto initialProduct = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(subCategory.getId())
                .brandId(brand.getId())
                .title("Apex Smart Watch Ultra")
                .basePrice(new BigDecimal("249.99"))
                .sku(sku)
                .stockQuantity(80)
                .build());

        UpdateProductRequest updateReq = UpdateProductRequest.builder()
                .categoryId(subCategory.getId())
                .brandId(brand.getId())
                .title("Apex Smart Watch Ultra 2")
                .shortDescription("Enhanced titanium casing with OLED display")
                .basePrice(new BigDecimal("299.99"))
                .discountPrice(new BigDecimal("279.99"))
                .stockQuantity(120)
                .lowStockThreshold(10)
                .hsnCode("91021200")
                .tags("smartwatch, oled, health, gps")
                .build();

        ProductResponseDto updated = vendorProductService.updateProduct(vendorEmail, initialProduct.getId(), updateReq);

        assertEquals("Apex Smart Watch Ultra 2", updated.getTitle());
        assertEquals(new BigDecimal("299.99"), updated.getBasePrice());
        assertEquals(120, updated.getStockQuantity());
        assertEquals("91021200", updated.getHsnCode());

        // Submit for review
        ProductResponseDto submitted = vendorProductService.submitProductForReview(vendorEmail, updated.getId());
        assertEquals(ProductStatus.PENDING_APPROVAL, submitted.getStatus());
    }
}
