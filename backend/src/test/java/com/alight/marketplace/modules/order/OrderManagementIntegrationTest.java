package com.alight.marketplace.modules.order;

import com.alight.marketplace.common.exception.ForbiddenException;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
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
import com.alight.marketplace.modules.order.dto.*;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.OrderStatus;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class OrderManagementIntegrationTest {

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
    private User buyer2;
    private User vendorUser1;
    private User vendorUser2;
    private String vEmail1;
    private String vEmail2;
    private VendorResponseDto vendor1;
    private VendorResponseDto vendor2;
    private ProductResponseDto product1;
    private ProductResponseDto product2;
    private ProductVariantDto variant1;
    private ProductVariantDto variant2;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "buyer_" + suffix + "@alight.com";
        String buyer2Email = "buyer2_" + suffix + "@alight.com";
        vEmail1 = "vendor1_" + suffix + "@alight.com";
        vEmail2 = "vendor2_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Buyer")
                .lastName("One")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(buyer2Email)
                .password("Password123!")
                .firstName("Buyer")
                .lastName("Two")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer2 = userRepository.findByEmail(buyer2Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vEmail1)
                .password("Password123!")
                .firstName("Vendor")
                .lastName("Alpha")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser1 = userRepository.findByEmail(vEmail1).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vEmail2)
                .password("Password123!")
                .firstName("Vendor")
                .lastName("Beta")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser2 = userRepository.findByEmail(vEmail2).orElseThrow();

        vendor1 = vendorService.applyAsVendor(vEmail1, VendorApplicationRequest.builder()
                .storeName("Alpha Tech " + suffix)
                .description("Alpha Tech electronics")
                .supportEmail(vEmail1)
                .supportPhone("+15554443321")
                .legalBusinessName("Alpha Tech Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("112233445566")
                .bankIfscCode("HDFC0001122")
                .bankName("HDFC")
                .bankAccountHolderName("Alpha Tech Pvt Ltd")
                .pickupContactPerson("Alpha Lead")
                .pickupContactPhone("+15554443321")
                .pickupAddressLine1("Alpha Street 1")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor1.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        vendor2 = vendorService.applyAsVendor(vEmail2, VendorApplicationRequest.builder()
                .storeName("Beta Fashion " + suffix)
                .description("Beta Fashion apparel")
                .supportEmail(vEmail2)
                .supportPhone("+15554443322")
                .legalBusinessName("Beta Fashion LLC")
                .businessType(BusinessType.PROPRIETORSHIP)
                .bankAccountNumber("223344556677")
                .bankIfscCode("ICIC0002233")
                .bankName("ICICI")
                .bankAccountHolderName("Beta Fashion LLC")
                .pickupContactPerson("Beta Lead")
                .pickupContactPhone("+15554443322")
                .pickupAddressLine1("Beta Street 2")
                .pickupCity("Pune")
                .pickupState("Maharashtra")
                .pickupPostalCode("411001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor2.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        WarehouseDto wh1 = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Alpha Hub " + suffix)
                .code("WH-ALP-" + suffix.toUpperCase())
                .addressLine1("Alpha Warehouse 1")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vEmail1);

        WarehouseDto wh2 = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Beta Hub " + suffix)
                .code("WH-BET-" + suffix.toUpperCase())
                .addressLine1("Beta Warehouse 2")
                .city("Pune")
                .state("Maharashtra")
                .postalCode("411001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vEmail2);

        CategoryDto cat = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("General " + suffix)
                .active(true)
                .build());

        product1 = vendorProductService.createProduct(vEmail1, CreateProductRequest.builder()
                .categoryId(cat.getId())
                .title("Alpha Mechanical Keyboard " + suffix)
                .basePrice(new BigDecimal("2500.00"))
                .sku("KEYBOARD-" + suffix.toUpperCase())
                .stockQuantity(100)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("KB-RGB-" + suffix.toUpperCase())
                        .variantName("RGB Blue Switch")
                        .price(new BigDecimal("2500.00"))
                        .stockQuantity(100)
                        .active(true)
                        .build()))
                .build());
        variant1 = product1.getVariants().get(0);

        productRepository.findById(product1.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });

        product2 = vendorProductService.createProduct(vEmail2, CreateProductRequest.builder()
                .categoryId(cat.getId())
                .title("Beta Leather Jacket " + suffix)
                .basePrice(new BigDecimal("4500.00"))
                .sku("JACKET-" + suffix.toUpperCase())
                .stockQuantity(50)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("JK-BLK-" + suffix.toUpperCase())
                        .variantName("Black / Large")
                        .price(new BigDecimal("4500.00"))
                        .stockQuantity(50)
                        .active(true)
                        .build()))
                .build());
        variant2 = product2.getVariants().get(0);

        productRepository.findById(product2.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh1.getId())
                .productId(product1.getId())
                .variantId(variant1.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .build(), vEmail1);

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh2.getId())
                .productId(product2.getId())
                .variantId(variant2.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(30)
                .build(), vEmail2);
    }

    @Test
    @DisplayName("Stage 12: End-to-end multi-vendor order checkout with sub-order splitting and commission calculations")
    void testMultiVendorOrderCheckoutAndSubOrderSplitting() {
        // Add items from Vendor 1 and Vendor 2 to buyer's cart
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant1.getId())
                .quantity(2)
                .build());

        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant2.getId())
                .quantity(1)
                .build());

        InitiateCheckoutRequest checkoutReq = InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Aditya Verma")
                        .phone("9876543210")
                        .addressLine1("Flat 402, High Street Towers")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400001")
                        .country("IN")
                        .build())
                .notes("Please deliver during business hours")
                .build();

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), checkoutReq);

        assertNotNull(order);
        assertNotNull(order.getId());
        assertTrue(order.getOrderNumber().startsWith("ORD-"));
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        assertEquals(2, order.getVendorOrders().size());
        assertEquals(2, order.getItems().size());
        assertEquals(buyer.getId(), order.getUserId());

        // Verify sub-orders
        for (VendorOrderDto vo : order.getVendorOrders()) {
            assertNotNull(vo.getId());
            assertNotNull(vo.getSubOrderNumber());
            assertTrue(vo.getSubOrderNumber().contains("-V"));
            assertEquals(FulfillmentStatus.PENDING, vo.getFulfillmentStatus());
            assertNotNull(vo.getCommissionRate());
            assertNotNull(vo.getCommissionAmount());
            assertNotNull(vo.getVendorPayoutAmount());
            assertNotNull(vo.getSubtotalAmount());
            assertFalse(vo.getItems().isEmpty());
        }

        // Verify buyer order retrieval
        OrderDto retrieved = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(order.getId(), retrieved.getId());
        assertEquals(order.getOrderNumber(), retrieved.getOrderNumber());
        assertEquals(2, retrieved.getVendorOrders().size());
    }

    @Test
    @DisplayName("Stage 12: Sub-order fulfillment workflow with status transitions (PROCESSING -> SHIPPED -> DELIVERED)")
    void testVendorOrderFulfillmentProgression() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant1.getId())
                .quantity(1)
                .build());

        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant2.getId())
                .quantity(1)
                .build());

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Buyer Name")
                        .phone("9876543210")
                        .addressLine1("Street 1")
                        .city("Pune")
                        .state("Maharashtra")
                        .postalCode("411001")
                        .country("IN")
                        .build())
                .build());

        VendorOrderDto vOrder1 = order.getVendorOrders().stream()
                .filter(vo -> vo.getVendorId().equals(vendor1.getId()))
                .findFirst().orElseThrow();

        VendorOrderDto vOrder2 = order.getVendorOrders().stream()
                .filter(vo -> vo.getVendorId().equals(vendor2.getId()))
                .findFirst().orElseThrow();

        // 1. Vendor 1 updates status to PROCESSING
        VendorOrderDto updatedV1 = orderService.updateVendorOrderFulfillment(vendorUser1.getId(), vOrder1.getId(),
                UpdateFulfillmentRequest.builder()
                        .fulfillmentStatus(FulfillmentStatus.PROCESSING)
                        .notes("Packing items")
                        .build());
        assertEquals(FulfillmentStatus.PROCESSING, updatedV1.getFulfillmentStatus());

        OrderDto orderAfterV1Processing = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(OrderStatus.PROCESSING, orderAfterV1Processing.getStatus());

        // 2. Vendor 1 ships their part
        VendorOrderDto shippedV1 = orderService.updateVendorOrderFulfillment(vendorUser1.getId(), vOrder1.getId(),
                UpdateFulfillmentRequest.builder()
                        .fulfillmentStatus(FulfillmentStatus.SHIPPED)
                        .courierPartner("Delhivery")
                        .trackingNumber("DLV-987654321")
                        .build());
        assertEquals(FulfillmentStatus.SHIPPED, shippedV1.getFulfillmentStatus());
        assertEquals("Delhivery", shippedV1.getCourierPartner());
        assertEquals("DLV-987654321", shippedV1.getTrackingNumber());
        assertNotNull(shippedV1.getShippedAt());

        // 3. Vendor 2 ships their part -> Master order transitions to SHIPPED
        VendorOrderDto shippedV2 = orderService.updateVendorOrderFulfillment(vendorUser2.getId(), vOrder2.getId(),
                UpdateFulfillmentRequest.builder()
                        .fulfillmentStatus(FulfillmentStatus.SHIPPED)
                        .courierPartner("Blue Dart")
                        .trackingNumber("BD-123456789")
                        .build());
        assertEquals(FulfillmentStatus.SHIPPED, shippedV2.getFulfillmentStatus());

        OrderDto orderAfterBothShipped = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(OrderStatus.SHIPPED, orderAfterBothShipped.getStatus());

        // 4. Both vendors mark DELIVERED -> Master order transitions to DELIVERED
        orderService.updateVendorOrderFulfillment(vendorUser1.getId(), vOrder1.getId(),
                UpdateFulfillmentRequest.builder().fulfillmentStatus(FulfillmentStatus.DELIVERED).build());
        orderService.updateVendorOrderFulfillment(vendorUser2.getId(), vOrder2.getId(),
                UpdateFulfillmentRequest.builder().fulfillmentStatus(FulfillmentStatus.DELIVERED).build());

        OrderDto orderAfterDelivered = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(OrderStatus.DELIVERED, orderAfterDelivered.getStatus());
    }

    @Test
    @DisplayName("Stage 12: Order access control and isolation (customer, vendor, admin)")
    void testOrderAccessControlAndFiltering() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant1.getId())
                .quantity(1)
                .build());

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Buyer One")
                        .phone("9876543210")
                        .addressLine1("Street 1")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400001")
                        .country("IN")
                        .build())
                .build());

        // Buyer 1 can access
        assertDoesNotThrow(() -> orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false));

        // Buyer 2 cannot access Buyer 1's order
        assertThrows(ForbiddenException.class, () -> orderService.getOrderByNumber(order.getOrderNumber(), buyer2.getId(), false));

        // Admin can access any order
        assertDoesNotThrow(() -> orderService.getOrderByNumber(order.getOrderNumber(), buyer2.getId(), true));

        // Vendor can list their sub-orders
        Page<VendorOrderDto> vendor1Orders = orderService.getVendorOrders(vendorUser1.getId(), null, PageRequest.of(0, 10));
        assertNotNull(vendor1Orders);
        assertEquals(1, vendor1Orders.getContent().size());
        assertEquals(vendor1.getId(), vendor1Orders.getContent().get(0).getVendorId());

        // Admin can list all orders
        Page<OrderDto> allOrders = orderService.getAllOrdersAdmin(null, PageRequest.of(0, 10));
        assertNotNull(allOrders);
        assertTrue(allOrders.getContent().size() >= 1);
    }
}
