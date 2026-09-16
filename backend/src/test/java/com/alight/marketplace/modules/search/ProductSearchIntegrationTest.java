package com.alight.marketplace.modules.search;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateBrandRequest;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.BrandService;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.search.dto.SearchResultDto;
import com.alight.marketplace.modules.search.dto.SearchSuggestionDto;
import com.alight.marketplace.modules.search.service.SearchService;
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
class ProductSearchIntegrationTest {

    @Autowired
    private SearchService searchService;

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
    private ProductRepository productRepository;

    @Autowired
    private AuthService authService;

    private String vendorEmail;
    private CategoryDto category;
    private BrandDto brand;
    private String uniqueTag;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        vendorEmail = "search_seller_" + suffix + "@alight.com";
        uniqueTag = "tag" + suffix;

        // Register vendor
        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Search")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());

        VendorResponseDto vendorApp = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Search Emporium " + suffix)
                .description("Search test store")
                .supportEmail(vendorEmail)
                .supportPhone("+15559998877")
                .legalBusinessName("Search Emporium LLC")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("112233445566")
                .bankIfscCode("HDFC0009999")
                .bankName("HDFC")
                .bankAccountHolderName("Search Emporium LLC")
                .pickupContactPerson("Ops")
                .pickupContactPhone("+15559998877")
                .pickupAddressLine1("Street 1")
                .pickupCity("Delhi")
                .pickupState("Delhi")
                .pickupPostalCode("110001")
                .pickupCountry("India")
                .build());

        adminVendorService.updateVendorStatus(vendorApp.getId(),
                com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest.builder()
                        .status(VendorStatus.APPROVED)
                        .build());

        category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Wearable Tech " + suffix)
                .active(true)
                .build());

        brand = brandService.createBrand(CreateBrandRequest.builder()
                .name("HyperSound " + suffix)
                .featured(true)
                .active(true)
                .build());

        // Create Active Products for Search
        ProductResponseDto p1 = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .brandId(brand.getId())
                .title("HyperSound Wireless ANC Headphones " + suffix)
                .basePrice(new BigDecimal("199.99"))
                .discountPrice(new BigDecimal("149.99"))
                .sku("HS-ANC-" + suffix)
                .stockQuantity(50)
                .tags(uniqueTag + ", audio, wireless, noise-cancelling")
                .build());

        ProductResponseDto p2 = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .brandId(brand.getId())
                .title("HyperSound Sport Wireless Earbuds " + suffix)
                .basePrice(new BigDecimal("79.99"))
                .sku("HS-SPT-" + suffix)
                .stockQuantity(0) // Out of stock
                .tags(uniqueTag + ", sport, waterproof, earbuds")
                .build());

        // Mark them as ACTIVE in DB for search engine discovery
        productRepository.findById(p1.getId()).ifPresent(p -> { p.setStatus(ProductStatus.ACTIVE); productRepository.save(p); });
        productRepository.findById(p2.getId()).ifPresent(p -> { p.setStatus(ProductStatus.ACTIVE); productRepository.save(p); });
    }

    @Test
    @DisplayName("Should find products by title keyword query")
    void testSearchByTitleKeyword() {
        SearchResultDto result = searchService.search("HyperSound", category.getId(), null, null,
                null, null, null, null, "relevance", 0, 10);

        assertNotNull(result);
        assertTrue(result.getTotalElements() >= 2);
        assertNotNull(result.getFacets());
        assertEquals(2, result.getFacets().getBrands().get(brand.getName()));
    }

    @Test
    @DisplayName("Should filter search results by in-stock availability")
    void testSearchInStockFilter() {
        // In-stock only
        SearchResultDto inStockResult = searchService.search(uniqueTag, null, null, null,
                null, null, null, true, "relevance", 0, 10);
        assertEquals(1, inStockResult.getTotalElements());
        assertEquals(new BigDecimal("149.99"), inStockResult.getProducts().get(0).getDiscountPrice());

        // Out-of-stock only
        SearchResultDto outOfStockResult = searchService.search(uniqueTag, null, null, null,
                null, null, null, false, "relevance", 0, 10);
        assertEquals(1, outOfStockResult.getTotalElements());
        assertEquals("HyperSound Sport Wireless Earbuds " + uniqueTag.substring(3), outOfStockResult.getProducts().get(0).getTitle());
    }

    @Test
    @DisplayName("Should filter search results by price range")
    void testSearchPriceRangeFilter() {
        SearchResultDto budgetResult = searchService.search(uniqueTag, null, null, null,
                BigDecimal.ZERO, new BigDecimal("100.00"), null, null, "relevance", 0, 10);

        assertEquals(1, budgetResult.getTotalElements());
        assertEquals(new BigDecimal("79.99"), budgetResult.getProducts().get(0).getBasePrice());
    }

    @Test
    @DisplayName("Should sort search results by price ascending and descending")
    void testSearchSorting() {
        SearchResultDto ascResult = searchService.search(uniqueTag, null, null, null,
                null, null, null, null, "price_asc", 0, 10);

        assertEquals(2, ascResult.getTotalElements());
        assertEquals(new BigDecimal("79.99"), ascResult.getProducts().get(0).getBasePrice());
        assertEquals(new BigDecimal("199.99"), ascResult.getProducts().get(1).getBasePrice());
    }

    @Test
    @DisplayName("Should provide autocomplete suggestions for search query prefix")
    void testSearchSuggestions() {
        List<SearchSuggestionDto> suggestions = searchService.getSuggestions("HyperSound");
        assertNotNull(suggestions);
        assertFalse(suggestions.isEmpty());
        assertTrue(suggestions.stream().anyMatch(s -> s.getTitle().contains("HyperSound")));
    }
}
