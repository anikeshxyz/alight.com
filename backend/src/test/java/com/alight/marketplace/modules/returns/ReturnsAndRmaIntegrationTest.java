package com.alight.marketplace.modules.returns;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.UnauthorizedException;
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
import com.alight.marketplace.modules.order.dto.CheckoutAddressDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.dto.VendorOrderDto;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentRequest;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.service.PaymentService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.ProductVariantDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.returns.dto.*;
import com.alight.marketplace.modules.returns.entity.*;
import com.alight.marketplace.modules.returns.service.RmaPolicyService;
import com.alight.marketplace.modules.returns.service.RmaService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class ReturnsAndRmaIntegrationTest {

    @Autowired
    private RmaService rmaService;

    @Autowired
    private RmaPolicyService rmaPolicyService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private PaymentService paymentService;

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
    private User vendorUser;
    private String vendorEmail;
    private VendorResponseDto vendor;
    private CategoryDto category;
    private WarehouseDto warehouse;
    private ProductResponseDto product;
    private ProductVariantDto variant;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "rma_buyer_" + suffix + "@alight.com";
        String buyer2Email = "rma_buyer2_" + suffix + "@alight.com";
        vendorEmail = "rma_vendor_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Rma")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(buyer2Email)
                .password("Password123!")
                .firstName("Other")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer2 = userRepository.findByEmail(buyer2Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Rma")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Rma Gear " + suffix)
                .description("RMA testing store")
                .supportEmail(vendorEmail)
                .supportPhone("+15554443321")
                .legalBusinessName("Rma Gear Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("778899001122")
                .bankIfscCode("HDFC0007788")
                .bankName("HDFC")
                .bankAccountHolderName("Rma Gear Pvt Ltd")
                .pickupContactPerson("RMA Lead")
                .pickupContactPhone("+15554443321")
                .pickupAddressLine1("RMA St 1")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        warehouse = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("RMA Hub " + suffix)
                .code("WH-RMA-" + suffix.toUpperCase())
                .addressLine1("RMA Warehouse 1")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Audio Gear " + suffix)
                .active(true)
                .build());

        product = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Studio Headphones " + suffix)
                .basePrice(new BigDecimal("3500.00"))
                .sku("HP-" + suffix.toUpperCase())
                .stockQuantity(50)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("HP-PRO-" + suffix.toUpperCase())
                        .variantName("Pro Black")
                        .price(new BigDecimal("3500.00"))
                        .stockQuantity(50)
                        .active(true)
                        .build()))
                .build());
        variant = product.getVariants().get(0);

        productRepository.findById(product.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouse.getId())
                .productId(product.getId())
                .variantId(variant.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(30)
                .build(), vendorEmail);
    }

    private OrderDto createDeliveredOrder() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant.getId())
                .quantity(2)
                .build());

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Aditya Verma")
                        .phone("9876543210")
                        .addressLine1("Flat 202, Marine Drive")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400020")
                        .country("IN")
                        .build())
                .build());

        InitiatePaymentResponse initRes = paymentService.initiatePayment(
                InitiatePaymentRequest.builder()
                        .orderId(order.getId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .paymentMethod("MOCK_CARD")
                        .build(),
                buyer.getEmail()
        );

        paymentService.verifyPayment(
                VerifyPaymentRequest.builder()
                        .transactionId(initRes.getTransactionId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .razorpayOrderId(initRes.getGatewayOrderId())
                        .razorpayPaymentId("PAY_MOCK_" + UUID.randomUUID())
                        .razorpaySignature("mock_sig")
                        .build(),
                buyer.getEmail()
        );

        VendorOrderDto vo = order.getVendorOrders().get(0);
        orderService.updateVendorOrderFulfillment(vendorUser.getId(), vo.getId(),
                com.alight.marketplace.modules.order.dto.UpdateFulfillmentRequest.builder()
                        .fulfillmentStatus(FulfillmentStatus.DELIVERED)
                        .courierPartner("Blue Dart")
                        .trackingNumber("BD-999888777")
                        .build());

        return orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
    }

    @Test
    @DisplayName("Stage 15: RMA Policy configuration and rule evaluation")
    void testRmaPolicyEvaluation() {
        RmaPolicyDto defaultPolicy = rmaPolicyService.getEffectivePolicy(category.getId(), vendor.getId());
        assertNotNull(defaultPolicy);
        assertTrue(defaultPolicy.getIsReturnable());
        assertTrue(defaultPolicy.getReturnWindowDays() >= 7);

        // Create custom vendor RMA policy
        RmaPolicyDto createdPolicy = rmaPolicyService.createPolicy(RmaPolicyDto.builder()
                .policyName("Vendor 30-Day Return Policy")
                .vendorId(vendor.getId())
                .categoryId(category.getId())
                .returnWindowDays(30)
                .isReturnable(true)
                .restockingFeePercentage(new BigDecimal("5.00"))
                .allowRefund(true)
                .allowReplacement(true)
                .build());

        assertNotNull(createdPolicy);
        assertEquals(30, createdPolicy.getReturnWindowDays());
    }

    @Test
    @DisplayName("Stage 15: Customer initiates RMA return request with line items and validation")
    void testCustomerInitiateRmaRequest() {
        OrderDto order = createDeliveredOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);
        UUID orderItemId = vendorOrder.getItems().get(0).getId();

        CreateRmaRequestDto rmaReq = CreateRmaRequestDto.builder()
                .orderId(order.getId())
                .vendorOrderId(vendorOrder.getId())
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.DEFECTIVE)
                .customerComments("Left audio driver not functioning")
                .proofImages("https://storage.alight.com/proofs/defect1.jpg")
                .items(List.of(RmaItemInputDto.builder()
                        .orderItemId(orderItemId)
                        .quantity(1)
                        .build()))
                .build();

        RmaResponseDto rma = rmaService.createRmaRequest(buyer.getEmail(), rmaReq);

        assertNotNull(rma);
        assertNotNull(rma.getId());
        assertTrue(rma.getRmaNumber().startsWith("RMA-"));
        assertEquals(RmaStatus.REQUESTED, rma.getStatus());
        assertEquals(1, rma.getItems().size());
        assertTrue(rma.getNetRefundAmount().compareTo(BigDecimal.ZERO) > 0);
        assertFalse(rma.getEvents().isEmpty());

        // Verify retrieval
        RmaResponseDto retrieved = rmaService.getRmaByNumber(rma.getRmaNumber(), buyer.getEmail());
        assertEquals(rma.getId(), retrieved.getId());
    }

    @Test
    @DisplayName("Stage 15: Vendor reviews, schedules reverse pickup, performs QC inspection, and triggers refund")
    void testVendorRmaLifecycleAndQualityInspection() {
        OrderDto order = createDeliveredOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);
        UUID orderItemId = vendorOrder.getItems().get(0).getId();

        RmaResponseDto rma = rmaService.createRmaRequest(buyer.getEmail(), CreateRmaRequestDto.builder()
                .orderId(order.getId())
                .vendorOrderId(vendorOrder.getId())
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.DAMAGED_IN_TRANSIT)
                .customerComments("Damaged packaging and broken jack")
                .items(List.of(RmaItemInputDto.builder()
                        .orderItemId(orderItemId)
                        .quantity(1)
                        .build()))
                .build());

        // 1. Vendor approves return request
        RmaResponseDto approvedRma = rmaService.reviewRmaByVendor(rma.getId(), vendorEmail,
                RmaReviewRequestDto.builder()
                        .approved(true)
                        .reviewNotes("Approved for pickup")
                        .build());
        assertEquals(RmaStatus.APPROVED, approvedRma.getStatus());

        // 2. Vendor schedules reverse logistics pickup
        RmaResponseDto pickupRma = rmaService.scheduleReversePickup(rma.getId(), vendorEmail,
                RmaSchedulePickupDto.builder()
                        .carrierCode("DELHIVERY")
                        .notes("Pickup between 10am-2pm")
                        .build());
        assertEquals(RmaStatus.PICKUP_SCHEDULED, pickupRma.getStatus());
        assertNotNull(pickupRma.getReverseAwbNumber());
        assertTrue(pickupRma.getReverseAwbNumber().startsWith("REV-"));

        // 3. Warehouse Quality Check & Restocking
        UUID rmaItemId = pickupRma.getItems().get(0).getId();
        RmaResponseDto qcRma = rmaService.inspectRmaItems(rma.getId(), vendorEmail,
                RmaInspectionRequestDto.builder()
                        .inspectionPassed(true)
                        .inspectionNotes("Item in factory condition, repackaged")
                        .items(List.of(RmaInspectionItemDto.builder()
                                .rmaItemId(rmaItemId)
                                .condition(ItemCondition.UNOPENED)
                                .restockAction(RestockAction.RESTOCK_AVAILABLE)
                                .warehouseId(warehouse.getId())
                                .notes("Restocked to main shelf")
                                .build()))
                        .build());

        assertEquals(RmaStatus.REFUND_PROCESSED, qcRma.getStatus());
        assertNotNull(qcRma.getCompletedAt());
        assertTrue(qcRma.getEvents().size() >= 4); // Requested -> Approved -> Pickup -> Inspected
    }

    @Test
    @DisplayName("Stage 15: Customer cancels RMA return request and security isolation")
    void testRmaCancellationAndSecurity() {
        OrderDto order = createDeliveredOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);
        UUID orderItemId = vendorOrder.getItems().get(0).getId();

        RmaResponseDto rma = rmaService.createRmaRequest(buyer.getEmail(), CreateRmaRequestDto.builder()
                .orderId(order.getId())
                .vendorOrderId(vendorOrder.getId())
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.CHANGED_MIND)
                .customerComments("No longer needed")
                .items(List.of(RmaItemInputDto.builder()
                        .orderItemId(orderItemId)
                        .quantity(1)
                        .build()))
                .build());

        // Buyer 2 cannot access or cancel Buyer 1's RMA
        assertThrows(UnauthorizedException.class, () -> rmaService.getRmaByNumber(rma.getRmaNumber(), buyer2.getEmail()));
        assertThrows(UnauthorizedException.class, () -> rmaService.cancelRmaRequest(rma.getRmaNumber(), buyer2.getEmail()));

        // Buyer 1 cancels RMA
        RmaResponseDto cancelledRma = rmaService.cancelRmaRequest(rma.getRmaNumber(), buyer.getEmail());
        assertEquals(RmaStatus.CANCELLED, cancelledRma.getStatus());

        // Cannot cancel already cancelled RMA
        assertThrows(BadRequestException.class, () -> rmaService.cancelRmaRequest(rma.getRmaNumber(), buyer.getEmail()));
    }
}
