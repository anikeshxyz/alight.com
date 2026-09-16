package com.alight.marketplace.modules.logistics;

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
import com.alight.marketplace.modules.logistics.dto.*;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import com.alight.marketplace.modules.logistics.service.LogisticsService;
import com.alight.marketplace.modules.logistics.service.ShipmentTrackingService;
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
import com.alight.marketplace.modules.settlement.dto.VendorWalletDto;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class LogisticsAndShippingIntegrationTest {

    @Autowired
    private LogisticsService logisticsService;

    @Autowired
    private ShipmentTrackingService trackingService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private SettlementService settlementService;

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
    private User vendorUser;
    private String vendorEmail;
    private VendorResponseDto vendor;
    private ProductResponseDto product;
    private ProductVariantDto variant;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "log_buyer_" + suffix + "@alight.com";
        vendorEmail = "log_vendor_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Logistics")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Logistics")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Logistics Pro " + suffix)
                .description("Logistics testing store")
                .supportEmail(vendorEmail)
                .supportPhone("+15554443321")
                .legalBusinessName("Logistics Pro Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("667788990011")
                .bankIfscCode("HDFC0006677")
                .bankName("HDFC")
                .bankAccountHolderName("Logistics Pro Ltd")
                .pickupContactPerson("Logistics Lead")
                .pickupContactPhone("+15554443321")
                .pickupAddressLine1("Logistics Hub 1")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        WarehouseDto wh = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Logistics WH " + suffix)
                .code("WH-LOG-" + suffix.toUpperCase())
                .addressLine1("Logistics Way 1")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        CategoryDto cat = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Heavy Machinery " + suffix)
                .active(true)
                .build());

        product = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(cat.getId())
                .title("Industrial Drone " + suffix)
                .basePrice(new BigDecimal("12000.00"))
                .sku("DRONE-" + suffix.toUpperCase())
                .stockQuantity(50)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("DRONE-4K-" + suffix.toUpperCase())
                        .variantName("4K Pro")
                        .price(new BigDecimal("12000.00"))
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
                .warehouseId(wh.getId())
                .productId(product.getId())
                .variantId(variant.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(30)
                .build(), vendorEmail);
    }

    private OrderDto createPaidTestOrder() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant.getId())
                .quantity(1)
                .build());

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Aditya Verma")
                        .phone("9876543210")
                        .addressLine1("Tower B, Tech Park")
                        .city("Bangalore")
                        .state("Karnataka")
                        .postalCode("560001")
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

        return orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
    }

    @Test
    @DisplayName("Stage 14: Pincode serviceability lookup, ETA estimation, and zone classification")
    void testPincodeServiceabilityAndEtaCalculation() {
        ServiceabilityResponseDto serviceability = logisticsService.checkServiceability("400001", "110001");
        assertNotNull(serviceability);
        assertTrue(serviceability.isServiceable());
        assertTrue(serviceability.isPrepaidServiceable());
        assertTrue(serviceability.getEstimatedTransitDays() > 0);
        assertNotNull(serviceability.getEstimatedDeliveryDate());
        assertNotNull(serviceability.getPrimaryCourierPartner());
    }

    @Test
    @DisplayName("Stage 14: Dynamic shipping rate calculation across weight slabs and carrier priority")
    void testShippingRateCalculation() {
        RateCalculationRequest request = RateCalculationRequest.builder()
                .originPincode("400001")
                .destinationPincode("560001")
                .lengthCm(new BigDecimal("20.00"))
                .widthCm(new BigDecimal("15.00"))
                .heightCm(new BigDecimal("10.00"))
                .weightKg(new BigDecimal("2.50"))
                .shippingMode("STANDARD")
                .build();

        List<ShippingRateDto> rates = logisticsService.calculateRates(request);
        assertNotNull(rates);
        assertFalse(rates.isEmpty());

        ShippingRateDto rate = rates.get(0);
        assertNotNull(rate.getCarrierCode());
        assertNotNull(rate.getCarrierName());
        assertTrue(rate.getTotalShippingCost().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(rate.getBilledWeightKg().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Stage 14: Shipment package creation, AWB generation, and initial manifest event")
    void testShipmentCreationAndAwbGeneration() {
        OrderDto order = createPaidTestOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);

        CreateShipmentRequest shipReq = CreateShipmentRequest.builder()
                .vendorOrderId(vendorOrder.getId())
                .carrierCode("DELHIVERY")
                .shippingMode("STANDARD")
                .packageLengthCm(new BigDecimal("25.00"))
                .packageWidthCm(new BigDecimal("20.00"))
                .packageHeightCm(new BigDecimal("10.00"))
                .deadWeightKg(new BigDecimal("1.50"))
                .build();

        ShipmentPackageDto shipment = logisticsService.createShipment(shipReq, vendor.getId());

        assertNotNull(shipment);
        assertNotNull(shipment.getId());
        assertNotNull(shipment.getAwbNumber());
        assertTrue(shipment.getAwbNumber().startsWith("DLV-") || shipment.getAwbNumber().length() > 5);
        assertEquals(ShipmentStatus.MANIFESTED, shipment.getStatus());
        assertNotNull(shipment.getShippingLabelUrl());

        // Verify vendor order updated
        OrderDto refreshedOrder = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        VendorOrderDto refreshedVo = refreshedOrder.getVendorOrders().get(0);
        assertEquals(shipment.getAwbNumber(), refreshedVo.getTrackingNumber());
        assertEquals(FulfillmentStatus.PROCESSING, refreshedVo.getFulfillmentStatus());
    }

    @Test
    @DisplayName("Stage 14: Full checkpoint milestone timeline progression and automated Escrow release upon delivery")
    void testMilestoneCheckpointProgressionAndEscrowRelease() {
        OrderDto order = createPaidTestOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);

        ShipmentPackageDto shipment = logisticsService.createShipment(
                CreateShipmentRequest.builder()
                        .vendorOrderId(vendorOrder.getId())
                        .carrierCode("DELHIVERY")
                        .deadWeightKg(new BigDecimal("1.00"))
                        .build(),
                vendor.getId()
        );

        // 1. Checkpoint 1: PICKED_UP
        trackingService.addTrackingEvent(shipment.getId(), AddTrackingEventRequest.builder()
                .eventStatus("PICKED_UP")
                .locationHub("Mumbai Warehouse Hub")
                .city("Mumbai")
                .state("Maharashtra")
                .remarks("Package collected from vendor warehouse")
                .build());

        TrackingTimelineDto timelineAfterPickup = trackingService.getTrackingTimelineByAwb(shipment.getAwbNumber());
        assertEquals("PICKED_UP", timelineAfterPickup.getCurrentStatus());

        // 2. Checkpoint 2: IN_TRANSIT
        trackingService.addTrackingEvent(shipment.getId(), AddTrackingEventRequest.builder()
                .eventStatus("IN_TRANSIT")
                .locationHub("National Sorting Center")
                .city("Pune")
                .state("Maharashtra")
                .remarks("In transit to destination city")
                .build());

        // 3. Checkpoint 3: OUT_FOR_DELIVERY
        trackingService.addTrackingEvent(shipment.getId(), AddTrackingEventRequest.builder()
                .eventStatus("OUT_FOR_DELIVERY")
                .locationHub("Bangalore Delivery Hub")
                .city("Bangalore")
                .state("Karnataka")
                .remarks("Out for delivery with rider")
                .build());

        // 4. Checkpoint 4: DELIVERED -> Triggers automatic Escrow release
        trackingService.addTrackingEvent(shipment.getId(), AddTrackingEventRequest.builder()
                .eventStatus("DELIVERED")
                .locationHub("Bangalore Delivery Hub")
                .city("Bangalore")
                .state("Karnataka")
                .remarks("Handed over to customer")
                .build());

        TrackingTimelineDto finalTimeline = trackingService.getTrackingTimelineByAwb(shipment.getAwbNumber());
        assertEquals("DELIVERED", finalTimeline.getCurrentStatus());
        assertTrue(finalTimeline.getEvents().size() >= 5); // Manifested + 4 checkpoints

        // Verify Vendor Sub-Order updated to DELIVERED
        OrderDto finalOrder = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        VendorOrderDto finalVo = finalOrder.getVendorOrders().get(0);
        assertEquals(FulfillmentStatus.DELIVERED, finalVo.getFulfillmentStatus());
        assertEquals(OrderStatus.DELIVERED, finalOrder.getStatus());

        // Verify Escrow Released into Available Balance in Vendor Wallet
        VendorWalletDto wallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertNotNull(wallet);
        assertTrue(wallet.getAvailableBalance().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Stage 14: Ingest carrier webhook callback and update package tracking timeline")
    void testCarrierWebhookProcessing() {
        OrderDto order = createPaidTestOrder();
        VendorOrderDto vendorOrder = order.getVendorOrders().get(0);

        ShipmentPackageDto shipment = logisticsService.createShipment(
                CreateShipmentRequest.builder()
                        .vendorOrderId(vendorOrder.getId())
                        .carrierCode("DELHIVERY")
                        .deadWeightKg(new BigDecimal("1.00"))
                        .build(),
                vendor.getId()
        );

        String webhookPayload = """
                {
                    "awbNumber": "%s",
                    "status": "OUT_FOR_DELIVERY",
                    "location": "Local Hub Bangalore",
                    "remarks": "Courier out for delivery"
                }
                """.formatted(shipment.getAwbNumber());

        trackingService.processCarrierWebhook("DELHIVERY", webhookPayload, "sig123");

        TrackingTimelineDto timeline = trackingService.getTrackingTimelineByAwb(shipment.getAwbNumber());
        assertNotNull(timeline);
        assertEquals("OUT_FOR_DELIVERY", timeline.getCurrentStatus());
    }
}
