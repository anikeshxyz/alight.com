package com.alight.marketplace.modules.payment;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyRequest;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.dto.UpdateExchangeRateRequest;
import com.alight.marketplace.modules.currency.service.CurrencyService;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.order.dto.CheckoutAddressDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.PaymentStatus;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.payment.dto.*;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import com.alight.marketplace.modules.payment.service.PaymentService;
import com.alight.marketplace.modules.payment.service.PaymentWebhookService;
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
class PaymentAndMultiCurrencyIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentWebhookService paymentWebhookService;

    @Autowired
    private CurrencyService currencyService;

    @Autowired
    private SettlementService settlementService;

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
    private User vendorUser;
    private String vendorEmail;
    private VendorResponseDto vendor;
    private ProductResponseDto product;
    private ProductVariantDto variant;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "pay_buyer_" + suffix + "@alight.com";
        vendorEmail = "pay_vendor_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Payment")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Payment")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Payment Tech " + suffix)
                .description("Payment Tech test store")
                .supportEmail(vendorEmail)
                .supportPhone("+15554443321")
                .legalBusinessName("Payment Tech Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("556677889900")
                .bankIfscCode("HDFC0005566")
                .bankName("HDFC")
                .bankAccountHolderName("Payment Tech Ltd")
                .pickupContactPerson("Pay Lead")
                .pickupContactPhone("+15554443321")
                .pickupAddressLine1("Payment Way 1")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        WarehouseDto wh = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Pay Hub " + suffix)
                .code("WH-PAY-" + suffix.toUpperCase())
                .addressLine1("Pay Hub 1")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        CategoryDto cat = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Payment Cat " + suffix)
                .active(true)
                .build());

        product = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(cat.getId())
                .title("Smart POS Device " + suffix)
                .basePrice(new BigDecimal("5000.00"))
                .sku("POS-" + suffix.toUpperCase())
                .stockQuantity(100)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("POS-STD-" + suffix.toUpperCase())
                        .variantName("Standard")
                        .price(new BigDecimal("5000.00"))
                        .stockQuantity(100)
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
                .quantity(50)
                .build(), vendorEmail);
    }

    private OrderDto createTestOrder() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant.getId())
                .quantity(1)
                .build());

        return checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Aditya Verma")
                        .phone("9876543210")
                        .addressLine1("Flat 101, Test St")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400001")
                        .country("IN")
                        .build())
                .build());
    }

    @Test
    @DisplayName("Stage 13: Multi-currency conversion calculations, formatting, and exchange rate auditing")
    void testMultiCurrencyConversionsAndExchangeRates() {
        List<CurrencyDto> currencies = currencyService.getAllActiveCurrencies();
        assertNotNull(currencies);
        assertFalse(currencies.isEmpty());

        CurrencyDto baseCurr = currencyService.getBaseCurrency();
        assertNotNull(baseCurr);
        assertEquals("INR", baseCurr.getCode());

        // Currency conversion INR -> USD
        ConvertCurrencyResponse usdRes = currencyService.convert(ConvertCurrencyRequest.builder()
                .amount(new BigDecimal("10000.00"))
                .fromCurrency("INR")
                .toCurrency("USD")
                .build());
        assertNotNull(usdRes);
        assertEquals("INR", usdRes.getFromCurrency());
        assertEquals("USD", usdRes.getToCurrency());
        assertTrue(usdRes.getConvertedAmount().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(usdRes.getFormattedConverted().contains("$") || usdRes.getFormattedConverted().contains("USD"));

        // Currency conversion USD -> EUR cross rate calculation
        ConvertCurrencyResponse crossRes = currencyService.convert(ConvertCurrencyRequest.builder()
                .amount(new BigDecimal("100.00"))
                .fromCurrency("USD")
                .toCurrency("EUR")
                .build());
        assertNotNull(crossRes);
        assertTrue(crossRes.getConvertedAmount().compareTo(BigDecimal.ZERO) > 0);

        // Update exchange rate
        CurrencyDto updatedUsd = currencyService.updateExchangeRate(UpdateExchangeRateRequest.builder()
                .code("USD")
                .exchangeRate(new BigDecimal("84.50000000"))
                .build());
        assertNotNull(updatedUsd);
        assertEquals(0, new BigDecimal("84.50000000").compareTo(updatedUsd.getExchangeRateToBase()));
    }

    @Test
    @DisplayName("Stage 13: Payment initiation and verification with automated Escrow holding")
    void testPaymentInitiationAndEscrowHold() {
        OrderDto order = createTestOrder();

        // 1. Initiate Mock payment
        InitiatePaymentResponse initRes = paymentService.initiatePayment(
                InitiatePaymentRequest.builder()
                        .orderId(order.getId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .paymentMethod("MOCK_CARD")
                        .build(),
                buyer.getEmail()
        );

        assertNotNull(initRes);
        assertNotNull(initRes.getTransactionId());
        assertNotNull(initRes.getTransactionReference());
        assertNotNull(initRes.getGatewayOrderId());

        // 2. Verify payment with mock signature
        PaymentTransactionDto verifiedTx = paymentService.verifyPayment(
                VerifyPaymentRequest.builder()
                        .transactionId(initRes.getTransactionId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .razorpayOrderId(initRes.getGatewayOrderId())
                        .razorpayPaymentId("PAY_MOCK_" + UUID.randomUUID())
                        .razorpaySignature("mock_sig")
                        .build(),
                buyer.getEmail()
        );

        assertNotNull(verifiedTx);
        assertEquals(PaymentTransactionStatus.CAPTURED, verifiedTx.getTransactionStatus());

        // 3. Verify Order updated to PAID and CONFIRMED
        OrderDto updatedOrder = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(PaymentStatus.PAID, updatedOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, updatedOrder.getStatus());

        // 4. Verify Escrow balance in vendor wallet
        VendorWalletDto wallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertNotNull(wallet);
        assertTrue(wallet.getPendingBalance().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Stage 13: Webhook callback processing with idempotency and duplicate deduplication")
    void testWebhookProcessingAndIdempotency() {
        OrderDto order = createTestOrder();

        InitiatePaymentResponse initRes = paymentService.initiatePayment(
                InitiatePaymentRequest.builder()
                        .orderId(order.getId())
                        .gatewayType(PaymentGatewayType.RAZORPAY)
                        .paymentMethod("UPI")
                        .build(),
                buyer.getEmail()
        );

        String eventId = "rzp_evt_" + UUID.randomUUID();
        String payload = """
                {
                    "id": "%s",
                    "event": "payment.captured",
                    "payload": {
                        "payment": {
                            "entity": {
                                "id": "pay_test_12345",
                                "order_id": "%s",
                                "amount": 500000,
                                "status": "captured"
                            }
                        }
                    }
                }
                """.formatted(eventId, initRes.getGatewayOrderId());

        // 1. Process webhook first time
        WebhookProcessResult firstResult = paymentWebhookService.processRazorpayWebhook(payload, "sig_abc", "127.0.0.1");
        assertTrue(firstResult.isProcessed());
        assertFalse(firstResult.isDuplicate());

        // 2. Re-send identical webhook (idempotency check)
        WebhookProcessResult secondResult = paymentWebhookService.processRazorpayWebhook(payload, "sig_abc", "127.0.0.1");
        assertTrue(secondResult.isProcessed());
        assertTrue(secondResult.isDuplicate());
        assertEquals("Event already processed", secondResult.getMessage());
    }

    @Test
    @DisplayName("Stage 13: Refund processing and escrow reversal workflow")
    void testRefundProcessingAndEscrowReversal() {
        OrderDto order = createTestOrder();

        InitiatePaymentResponse initRes = paymentService.initiatePayment(
                InitiatePaymentRequest.builder()
                        .orderId(order.getId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .paymentMethod("MOCK_CARD")
                        .build(),
                buyer.getEmail()
        );

        PaymentTransactionDto verifiedTx = paymentService.verifyPayment(
                VerifyPaymentRequest.builder()
                        .transactionId(initRes.getTransactionId())
                        .gatewayType(PaymentGatewayType.MOCK)
                        .razorpayOrderId(initRes.getGatewayOrderId())
                        .razorpayPaymentId("PAY_MOCK_" + UUID.randomUUID())
                        .razorpaySignature("mock_sig")
                        .build(),
                buyer.getEmail()
        );

        assertEquals(PaymentTransactionStatus.CAPTURED, verifiedTx.getTransactionStatus());

        // Process full refund
        PaymentTransactionDto refundTx = paymentService.processRefund(RefundRequestDto.builder()
                .transactionId(verifiedTx.getId())
                .amount(verifiedTx.getAmount())
                .reason("Customer cancelled before shipment")
                .build());

        assertNotNull(refundTx);
        assertEquals(PaymentTransactionStatus.REFUNDED, refundTx.getTransactionStatus());

        // Verify order status
        OrderDto refundedOrder = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(PaymentStatus.REFUNDED, refundedOrder.getPaymentStatus());
        assertEquals(OrderStatus.REFUNDED, refundedOrder.getStatus());
    }

    @Test
    @DisplayName("Stage 13: Offline bank transfer clearance and administrative approval")
    void testBankTransferApprovalWorkflow() {
        OrderDto order = createTestOrder();

        InitiatePaymentResponse initRes = paymentService.initiatePayment(
                InitiatePaymentRequest.builder()
                        .orderId(order.getId())
                        .gatewayType(PaymentGatewayType.BANK_TRANSFER)
                        .paymentMethod("WIRE")
                        .build(),
                buyer.getEmail()
        );

        // Submit bank transfer reference
        PaymentTransactionDto submittedTx = paymentService.verifyPayment(
                VerifyPaymentRequest.builder()
                        .transactionId(initRes.getTransactionId())
                        .gatewayType(PaymentGatewayType.BANK_TRANSFER)
                        .bankReferenceNumber("UTR-HDFC-987654321")
                        .receiptUrl("https://storage.alight.com/receipts/utr123.pdf")
                        .notes("Transferred via RTGS")
                        .build(),
                buyer.getEmail()
        );

        assertEquals(PaymentTransactionStatus.AUTHORIZED, submittedTx.getTransactionStatus());
        assertEquals("UTR-HDFC-987654321", submittedTx.getBankReferenceNumber());

        // Admin approves clearance
        PaymentTransactionDto approvedTx = paymentService.approveBankTransferPayment(submittedTx.getId(), "Funds credited in HDFC current A/C");
        assertNotNull(approvedTx);
        assertEquals(PaymentTransactionStatus.CAPTURED, approvedTx.getTransactionStatus());

        OrderDto approvedOrder = orderService.getOrderByNumber(order.getOrderNumber(), buyer.getId(), false);
        assertEquals(PaymentStatus.PAID, approvedOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, approvedOrder.getStatus());

        
    }
}