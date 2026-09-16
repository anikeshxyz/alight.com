package com.alight.marketplace.modules.cart;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.dto.CartItemDto;
import com.alight.marketplace.modules.cart.dto.CartResponseDto;
import com.alight.marketplace.modules.cart.dto.UpdateCartItemRequest;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.ProductVariantDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
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
class CartAndSavedForLaterIntegrationTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private VendorProductService vendorProductService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    private User customer;
    private ProductResponseDto productA;
    private ProductVariantDto variantA;
    private String guestSessionId;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        guestSessionId = "guest_session_" + suffix;
        String customerEmail = "customer_" + suffix + "@alight.com";
        String vendorEmail = "cart_vendor_" + suffix + "@alight.com";

        // Register customer
        authService.register(RegisterRequest.builder()
                .email(customerEmail)
                .password("Password123!")
                .firstName("Cart")
                .lastName("Customer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        customer = userRepository.findByEmail(customerEmail).orElseThrow();

        // Register and approve vendor
        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Cart")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());

        VendorResponseDto vendorApp = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Cart MegaStore " + suffix)
                .description("Multi-vendor test store")
                .supportEmail(vendorEmail)
                .supportPhone("+15554443322")
                .legalBusinessName("Cart MegaStore LLC")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("334455667788")
                .bankIfscCode("HDFC0003344")
                .bankName("HDFC")
                .bankAccountHolderName("Cart MegaStore LLC")
                .pickupContactPerson("Lead")
                .pickupContactPhone("+15554443322")
                .pickupAddressLine1("Cart Way 1")
                .pickupCity("Bangalore")
                .pickupState("Karnataka")
                .pickupPostalCode("560001")
                .pickupCountry("India")
                .build());

        adminVendorService.updateVendorStatus(vendorApp.getId(),
                com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest.builder()
                        .status(VendorStatus.APPROVED)
                        .build());

        // Warehouse & Inventory
        WarehouseDto wh = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Main Hub " + suffix)
                .code("WH-CART-" + suffix.toUpperCase())
                .addressLine1("Hub 1")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        CategoryDto cat = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Home Appliances " + suffix)
                .active(true)
                .build());

        productA = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(cat.getId())
                .title("Smart Blender Pro")
                .basePrice(new BigDecimal("150.00"))
                .sku("BLENDER-" + suffix.toUpperCase())
                .stockQuantity(100)
                .variants(List.of(
                        ProductVariantDto.builder()
                                .variantSku("BLENDER-" + suffix.toUpperCase() + "-SLV")
                                .variantName("Silver Edition")
                                .price(new BigDecimal("150.00"))
                                .stockQuantity(50)
                                .active(true)
                                .build()
                ))
                .build());

        variantA = productA.getVariants().get(0);

        productRepository.findById(productA.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh.getId())
                .productId(productA.getId())
                .variantId(variantA.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .build(), vendorEmail);
    }

    @Test
    @DisplayName("Should add item to guest cart and calculate multi-vendor totals")
    void testAddItemToCart() {
        CartResponseDto cart = cartService.addItem(null, AddToCartRequest.builder()
                .guestSessionId(guestSessionId)
                .variantId(variantA.getId())
                .quantity(2)
                .build());

        assertNotNull(cart);
        assertEquals(1, cart.getUniqueItems());
        assertEquals(2, cart.getTotalItems());
        assertEquals(0, cart.getSavedForLaterCount());
        assertEquals(new BigDecimal("300.00"), cart.getSubtotalAmount());
        assertNotNull(cart.getGrandTotal());
        assertEquals(1, cart.getVendorGroups().size());
    }

    @Test
    @DisplayName("Should move item to saved-for-later and restore back to active cart")
    void testSavedForLaterLifecycle() {
        // 1. Add item to cart
        CartResponseDto initialCart = cartService.addItem(null, AddToCartRequest.builder()
                .guestSessionId(guestSessionId)
                .variantId(variantA.getId())
                .quantity(1)
                .build());

        CartItemDto cartItem = initialCart.getItems().get(0);

        // 2. Move to saved for later
        CartResponseDto savedCart = cartService.moveToSavedForLater(null, guestSessionId, cartItem.getId());

        assertEquals(0, savedCart.getUniqueItems());
        assertEquals(0, savedCart.getTotalItems());
        assertEquals(BigDecimal.ZERO, savedCart.getSubtotalAmount());
        assertEquals(1, savedCart.getSavedForLaterCount());
        assertEquals(1, savedCart.getSavedForLaterItems().size());
        assertTrue(savedCart.getSavedForLaterItems().get(0).isSavedForLater());

        // 3. Move back to active cart
        CartResponseDto restoredCart = cartService.moveToCart(null, guestSessionId, cartItem.getId());

        assertEquals(1, restoredCart.getUniqueItems());
        assertEquals(1, restoredCart.getTotalItems());
        assertEquals(0, restoredCart.getSavedForLaterCount());
        assertEquals(new BigDecimal("150.00"), restoredCart.getSubtotalAmount());
        assertFalse(restoredCart.getItems().get(0).isSavedForLater());
    }

    @Test
    @DisplayName("Should merge guest cart into authenticated user cart upon login")
    void testMergeGuestCartIntoUserCart() {
        // 1. Add to guest cart
        cartService.addItem(null, AddToCartRequest.builder()
                .guestSessionId(guestSessionId)
                .variantId(variantA.getId())
                .quantity(3)
                .build());

        // 2. Merge guest session into customer user account
        CartResponseDto mergedCart = cartService.mergeGuestCart(customer.getId(), guestSessionId);

        assertNotNull(mergedCart);
        assertEquals(customer.getId(), mergedCart.getUserId());
        assertEquals(3, mergedCart.getTotalItems());
        assertEquals(new BigDecimal("450.00"), mergedCart.getSubtotalAmount());

        // Guest cart should now be empty
        CartResponseDto guestCartAfterMerge = cartService.getCart(null, guestSessionId);
        assertEquals(0, guestCartAfterMerge.getTotalItems());
    }
}
