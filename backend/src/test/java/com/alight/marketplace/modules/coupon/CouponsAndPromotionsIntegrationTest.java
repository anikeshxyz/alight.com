package com.alight.marketplace.modules.coupon;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.coupon.dto.*;
import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import com.alight.marketplace.modules.coupon.entity.CouponScope;
import com.alight.marketplace.modules.coupon.service.CouponService;
import com.alight.marketplace.modules.coupon.service.PromotionService;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.order.dto.CheckoutAddressDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.ProductVariantDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class CouponsAndPromotionsIntegrationTest {

    @Autowired
    private CouponService couponService;

    @Autowired
    private PromotionService promotionService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartService cartService;

    @Autowired
    private AuthService authService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private VendorProductService vendorProductService;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private User buyer;
    private User adminUser;
    private User vendorUser1;
    private User vendorUser2;
    private String vendorEmail1;
    private String vendorEmail2;
    private VendorResponseDto vendor1;
    private VendorResponseDto vendor2;
    private CategoryDto category;
    private ProductResponseDto product1;
    private ProductVariantDto variant1;
    private ProductResponseDto product2;
    private ProductVariantDto variant2;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "buyer_coupon_" + suffix + "@alight.com";
        String adminEmail = "admin_coupon_" + suffix + "@alight.com";
        vendorEmail1 = "vendor1_coupon_" + suffix + "@alight.com";
        vendorEmail2 = "vendor2_coupon_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Promo")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(adminEmail)
                .password("Password123!")
                .firstName("Platform")
                .lastName("Admin")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("ADMIN")
                .build());
        adminUser = userRepository.findByEmail(adminEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail1)
                .password("Password123!")
                .firstName("Vendor")
                .lastName("One")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser1 = userRepository.findByEmail(vendorEmail1).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail2)
                .password("Password123!")
                .firstName("Vendor")
                .lastName("Two")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser2 = userRepository.findByEmail(vendorEmail2).orElseThrow();

        vendor1 = vendorService.applyAsVendor(vendorEmail1, VendorApplicationRequest.builder()
                .storeName("Artisan Studio " + suffix)
                .description("Handmade decor and crafts")
                .supportEmail(vendorEmail1)
                .supportPhone("+15551112233")
                .legalBusinessName("Artisan Studio Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("111122223333")
                .bankIfscCode("HDFC0001111")
                .bankName("HDFC")
                .bankAccountHolderName("Artisan Studio Pvt Ltd")
                .pickupContactPerson("Lead Artisan")
                .pickupContactPhone("+15551112233")
                .pickupAddressLine1("Studio 101, Art District")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor1.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        vendor2 = vendorService.applyAsVendor(vendorEmail2, VendorApplicationRequest.builder()
                .storeName("Modern Lighting " + suffix)
                .description("Designer lighting and fixtures")
                .supportEmail(vendorEmail2)
                .supportPhone("+15552223344")
                .legalBusinessName("Modern Lighting Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("444455556666")
                .bankIfscCode("ICIC0002222")
                .bankName("ICICI")
                .bankAccountHolderName("Modern Lighting Pvt Ltd")
                .pickupContactPerson("Lighting Manager")
                .pickupContactPhone("+15552223344")
                .pickupAddressLine1("Lighting Park 202")
                .pickupCity("Bengaluru")
                .pickupState("Karnataka")
                .pickupPostalCode("560001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor2.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Home & Living " + suffix)
                .active(true)
                .build());

        WarehouseDto wh1 = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Artisan WH " + suffix)
                .code("WH-ART-" + suffix.toUpperCase())
                .addressLine1("WH 1")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail1);

        WarehouseDto wh2 = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Lighting WH " + suffix)
                .code("WH-LGT-" + suffix.toUpperCase())
                .addressLine1("WH 2")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail2);

        product1 = vendorProductService.createProduct(vendorEmail1, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Brass Desk Lamp " + suffix)
                .basePrice(new BigDecimal("2000.00"))
                .sku("LAMP-" + suffix.toUpperCase())
                .stockQuantity(100)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("LAMP-BRASS-" + suffix.toUpperCase())
                        .variantName("Antique Brass")
                        .price(new BigDecimal("2000.00"))
                        .stockQuantity(100)
                        .active(true)
                        .build()))
                .build());
        variant1 = product1.getVariants().get(0);
        productRepository.findById(product1.getId()).ifPresent(p -> { p.setStatus(ProductStatus.ACTIVE); productRepository.save(p); });

        product2 = vendorProductService.createProduct(vendorEmail2, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Ceramic Pendant Light " + suffix)
                .basePrice(new BigDecimal("3000.00"))
                .sku("PEND-" + suffix.toUpperCase())
                .stockQuantity(100)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("PEND-CER-" + suffix.toUpperCase())
                        .variantName("Matte White")
                        .price(new BigDecimal("3000.00"))
                        .stockQuantity(100)
                        .active(true)
                        .build()))
                .build());
        variant2 = product2.getVariants().get(0);
        productRepository.findById(product2.getId()).ifPresent(p -> { p.setStatus(ProductStatus.ACTIVE); productRepository.save(p); });

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh1.getId())
                .productId(product1.getId())
                .variantId(variant1.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .build(), vendorEmail1);

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh2.getId())
                .productId(product2.getId())
                .variantId(variant2.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .build(), vendorEmail2);
    }

    @Test
    @DisplayName("Stage 16: Percentage discount validation with maximum discount cap")
    void testGlobalPercentageDiscountWithMaxCap() {
        String code = "SALE25_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(code)
                .title("25% Off Global Festival")
                .discountType(CouponDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("25.00"))
                .maxDiscountAmount(new BigDecimal("600.00")) // Max cap: 600
                .minOrderAmount(new BigDecimal("1000.00"))
                .scope(CouponScope.GLOBAL)
                .isActive(true)
                .build(), adminUser.getEmail());

        // Test with subtotal = 4000: 25% of 4000 = 1000, capped at 600
        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("4000.00"))
                .shippingAmount(new BigDecimal("150.00"))
                .items(List.of(
                        CartItemContextDto.builder()
                                .productId(product1.getId())
                                .vendorId(vendor1.getId())
                                .quantity(2)
                                .unitPrice(new BigDecimal("2000.00"))
                                .lineTotal(new BigDecimal("4000.00"))
                                .build()
                ))
                .build();

        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, buyer.getEmail());

        assertTrue(response.isValid());
        assertEquals(code, response.getCouponCode());
        assertEquals(new BigDecimal("600.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("3400.00"), response.getRevisedSubtotal());
        assertEquals(new BigDecimal("3550.00"), response.getRevisedGrandTotal());
    }

    @Test
    @DisplayName("Stage 16: Fixed amount discount with minimum order threshold enforcement")
    void testFixedAmountDiscountAndMinOrderThreshold() {
        String code = "FLAT500_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(code)
                .title("Flat 500 Off")
                .discountType(CouponDiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("500.00"))
                .minOrderAmount(new BigDecimal("2500.00"))
                .scope(CouponScope.GLOBAL)
                .isActive(true)
                .build(), adminUser.getEmail());

        // Case 1: Subtotal below minimum order threshold (2000 < 2500)
        ApplyCouponRequestDto belowReq = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("2000.00"))
                .items(List.of(CartItemContextDto.builder()
                        .productId(product1.getId())
                        .vendorId(vendor1.getId())
                        .quantity(1)
                        .unitPrice(new BigDecimal("2000.00"))
                        .lineTotal(new BigDecimal("2000.00"))
                        .build()))
                .build();

        CouponValidationResponseDto failResp = couponService.validateAndCalculateDiscount(belowReq, buyer.getEmail());
        assertFalse(failResp.isValid());
        assertTrue(failResp.getMessage().contains("Minimum order amount"));
        assertEquals(BigDecimal.ZERO, failResp.getDiscountAmount());

        // Case 2: Subtotal meets minimum order threshold (5000 >= 2500)
        ApplyCouponRequestDto passReq = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("5000.00"))
                .shippingAmount(new BigDecimal("100.00"))
                .items(List.of(
                        CartItemContextDto.builder()
                                .productId(product1.getId())
                                .vendorId(vendor1.getId())
                                .quantity(1)
                                .unitPrice(new BigDecimal("2000.00"))
                                .lineTotal(new BigDecimal("2000.00"))
                                .build(),
                        CartItemContextDto.builder()
                                .productId(product2.getId())
                                .vendorId(vendor2.getId())
                                .quantity(1)
                                .unitPrice(new BigDecimal("3000.00"))
                                .lineTotal(new BigDecimal("3000.00"))
                                .build()
                ))
                .build();

        CouponValidationResponseDto passResp = couponService.validateAndCalculateDiscount(passReq, buyer.getEmail());
        assertTrue(passResp.isValid());
        assertEquals(new BigDecimal("500.00"), passResp.getDiscountAmount());
        assertEquals(new BigDecimal("4500.00"), passResp.getRevisedSubtotal());
        assertEquals(new BigDecimal("4600.00"), passResp.getRevisedGrandTotal());
    }

    @Test
    @DisplayName("Stage 16: Free shipping coupon discount calculation")
    void testFreeShippingCoupon() {
        String code = "FREESHIP_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(code)
                .title("Free Delivery Anywhere")
                .discountType(CouponDiscountType.FREE_SHIPPING)
                .discountValue(BigDecimal.ZERO)
                .minOrderAmount(new BigDecimal("1000.00"))
                .scope(CouponScope.GLOBAL)
                .isActive(true)
                .build(), adminUser.getEmail());

        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("2000.00"))
                .shippingAmount(new BigDecimal("250.00"))
                .items(List.of(CartItemContextDto.builder()
                        .productId(product1.getId())
                        .vendorId(vendor1.getId())
                        .quantity(1)
                        .unitPrice(new BigDecimal("2000.00"))
                        .lineTotal(new BigDecimal("2000.00"))
                        .build()))
                .build();

        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, buyer.getEmail());
        assertTrue(response.isValid());
        assertEquals(new BigDecimal("250.00"), response.getDiscountAmount());
        assertEquals(BigDecimal.ZERO, response.getRevisedShipping());
        assertEquals(new BigDecimal("2000.00"), response.getRevisedGrandTotal());
    }

    @Test
    @DisplayName("Stage 16: Multi-vendor cart with vendor-scoped coupon and proportional breakdown")
    void testVendorScopedCouponWithMultiVendorCart() {
        String code = "ARTISAN300_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        couponService.createVendorCoupon(vendorEmail1, CreateCouponDto.builder()
                .code(code)
                .title("₹300 off Artisan Store")
                .discountType(CouponDiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("300.00"))
                .minOrderAmount(new BigDecimal("1500.00"))
                .build());

        // Cart with items from both Vendor 1 (₹4000) and Vendor 2 (₹3000)
        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("7000.00"))
                .shippingAmount(new BigDecimal("200.00"))
                .items(List.of(
                        CartItemContextDto.builder()
                                .productId(product1.getId())
                                .vendorId(vendor1.getId())
                                .quantity(2)
                                .unitPrice(new BigDecimal("2000.00"))
                                .lineTotal(new BigDecimal("4000.00"))
                                .build(),
                        CartItemContextDto.builder()
                                .productId(product2.getId())
                                .vendorId(vendor2.getId())
                                .quantity(1)
                                .unitPrice(new BigDecimal("3000.00"))
                                .lineTotal(new BigDecimal("3000.00"))
                                .build()
                ))
                .build();

        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, buyer.getEmail());

        assertTrue(response.isValid());
        assertEquals(new BigDecimal("300.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("6700.00"), response.getRevisedSubtotal());

        // Verify that discount is allocated exclusively to Vendor 1
        assertNotNull(response.getVendorBreakdowns());
        assertEquals(1, response.getVendorBreakdowns().size());
        assertEquals(vendor1.getId(), response.getVendorBreakdowns().get(0).getVendorId());
        assertEquals(new BigDecimal("300.00"), response.getVendorBreakdowns().get(0).getAllocatedDiscount());
    }

    @Test
    @DisplayName("Stage 16: First-time buyer coupon restriction and usage limits")
    void testFirstTimeBuyerRestrictionAndUsageLimits() {
        String code = "WELCOME100_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CouponDto coupon = couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(code)
                .title("Welcome First Order Discount")
                .discountType(CouponDiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100.00"))
                .minOrderAmount(new BigDecimal("500.00"))
                .scope(CouponScope.FIRST_ORDER)
                .usageLimitPerUser(1)
                .usageLimitTotal(10)
                .isActive(true)
                .build(), adminUser.getEmail());

        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode(code)
                .cartSubtotal(new BigDecimal("2000.00"))
                .items(List.of(CartItemContextDto.builder()
                        .productId(product1.getId())
                        .vendorId(vendor1.getId())
                        .quantity(1)
                        .unitPrice(new BigDecimal("2000.00"))
                        .lineTotal(new BigDecimal("2000.00"))
                        .build()))
                .build();

        // 1. Initial attempt: User has 0 previous usages -> valid
        CouponValidationResponseDto firstTry = couponService.validateAndCalculateDiscount(request, buyer.getEmail());
        assertTrue(firstTry.isValid());

        // 2. Record coupon usage for this user
        couponService.recordCouponUsage(coupon.getId(), buyer.getId(), UUID.randomUUID(), new BigDecimal("100.00"));

        // 3. Second attempt: User now has usage recorded -> rejected for FIRST_ORDER / per-user limit
        CouponValidationResponseDto secondTry = couponService.validateAndCalculateDiscount(request, buyer.getEmail());
        assertFalse(secondTry.isValid());
        assertTrue(secondTry.getMessage().contains("first-time") || secondTry.getMessage().contains("usage limit"));
    }

    @Test
    @DisplayName("Stage 16: Expired and inactive coupons are rejected")
    void testCouponExpirationAndInactiveState() {
        String inactiveCode = "INACTIVE_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CouponDto inactiveCoupon = couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(inactiveCode)
                .title("Inactive Promo")
                .discountType(CouponDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .scope(CouponScope.GLOBAL)
                .isActive(false)
                .build(), adminUser.getEmail());

        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode(inactiveCode)
                .cartSubtotal(new BigDecimal("2000.00"))
                .build();

        CouponValidationResponseDto resp = couponService.validateAndCalculateDiscount(request, buyer.getEmail());
        assertFalse(resp.isValid());
        assertTrue(resp.getMessage().contains("inactive"));

        // Toggle to active and test
        couponService.toggleAdminCoupon(inactiveCoupon.getId());
        CouponValidationResponseDto activeResp = couponService.validateAndCalculateDiscount(request, buyer.getEmail());
        assertTrue(activeResp.isValid());
    }

    @Test
    @DisplayName("Stage 16: Admin and Vendor coupon CRUD and stats queries")
    void testAdminAndVendorCouponCrud() {
        // Vendor coupon management
        String vCode = "VNDR15_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CouponDto createdVndr = couponService.createVendorCoupon(vendorEmail1, CreateCouponDto.builder()
                .code(vCode)
                .title("Vendor 15% Off")
                .discountType(CouponDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("15.00"))
                .build());

        assertNotNull(createdVndr);
        assertEquals(vCode, createdVndr.getCode());

        Page<CouponDto> vendorCoupons = couponService.getVendorCoupons(vendorEmail1, PageRequest.of(0, 10));
        assertTrue(vendorCoupons.getTotalElements() >= 1);

        CouponStatsSummaryDto vendorStats = couponService.getVendorCouponStats(vendorEmail1);
        assertTrue(vendorStats.getTotalCoupons() >= 1);

        // Admin search and stats
        Page<CouponDto> adminSearch = couponService.searchAdminCoupons(vCode, null, PageRequest.of(0, 10));
        assertEquals(1, adminSearch.getTotalElements());

        CouponStatsSummaryDto adminStats = couponService.getAdminCouponStats();
        assertTrue(adminStats.getTotalCoupons() >= 1);
    }

    @Test
    @DisplayName("Stage 16: Promotion Banners and Flash Deals CRUD lifecycle")
    void testPromotionBannersAndFlashDealsCrud() {
        PromotionBannerDto banner = promotionService.createPromotion(PromotionBannerDto.builder()
                .title("Midnight Flash Deal")
                .bannerTag("FLASH_DEAL")
                .badgeText("50% OFF")
                .discountText("Up to 50% off architectural fixtures")
                .targetUrl("/flash-deals/midnight")
                .startTime(Instant.now().minus(1, ChronoUnit.HOURS))
                .endTime(Instant.now().plus(24, ChronoUnit.HOURS))
                .displayOrder(1)
                .isActive(true)
                .build());

        assertNotNull(banner);
        assertNotNull(banner.getId());
        assertNotNull(banner.getSlug());

        List<PromotionBannerDto> activePromos = promotionService.getActivePromotions();
        assertFalse(activePromos.isEmpty());
        assertTrue(activePromos.stream().anyMatch(p -> p.getId().equals(banner.getId())));

        // Update promotion
        PromotionBannerDto updated = promotionService.updatePromotion(banner.getId(), PromotionBannerDto.builder()
                .title("Extended Midnight Flash Deal")
                .badgeText("60% OFF")
                .build());
        assertEquals("Extended Midnight Flash Deal", updated.getTitle());
        assertEquals("60% OFF", updated.getBadgeText());

        // Delete promotion
        promotionService.deletePromotion(banner.getId());
        List<PromotionBannerDto> afterDelete = promotionService.getActivePromotions();
        assertTrue(afterDelete.stream().noneMatch(p -> p.getId().equals(banner.getId())));
    }

    @Test
    @DisplayName("Stage 16: End-to-end checkout with coupon application and usage tracking")
    void testEndToEndCheckoutWithCoupon() {
        String code = "CART10PCT_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CouponDto coupon = couponService.createAdminCoupon(CreateCouponDto.builder()
                .code(code)
                .title("Cart 10% Discount")
                .discountType(CouponDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .minOrderAmount(new BigDecimal("1000.00"))
                .scope(CouponScope.GLOBAL)
                .usageLimitPerUser(2)
                .isActive(true)
                .build(), adminUser.getEmail());

        // 1. Add item to cart (Quantity 2 = ₹4000)
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant1.getId())
                .quantity(2)
                .build());

        // 2. Initiate checkout with couponCode applied
        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .couponCode(code)
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Promo Buyer")
                        .phone("9876543210")
                        .addressLine1("Flat 101, Marine Drive")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400020")
                        .country("IN")
                        .build())
                .build());

        assertNotNull(order);
        // 10% of 4000 = 400 discount
        assertEquals(new BigDecimal("400.00"), order.getDiscountAmount());
        assertEquals(new BigDecimal("4000.00"), order.getSubtotalAmount());
        assertEquals(new BigDecimal("3600.00"), order.getTotalAmount());

        // 3. Verify that totalUsedCount was incremented
        CouponDto refreshedCoupon = couponService.searchAdminCoupons(code, null, PageRequest.of(0, 10)).getContent().get(0);
        assertEquals(1, refreshedCoupon.getTotalUsedCount());
    }
}
