package com.alight.marketplace.modules.settlement;

import com.alight.marketplace.common.exception.BadRequestException;
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
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.ProductVariantDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.WalletTransactionType;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.settlement.service.TaxComplianceService;
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
class SettlementAndPayoutsIntegrationTest {

    @Autowired
    private SettlementService settlementService;

    @Autowired
    private TaxComplianceService taxComplianceService;

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

    @Autowired
    private VendorOrderRepository vendorOrderRepository;

    private User buyer;
    private User vendorUser;
    private String vendorEmail;
    private VendorResponseDto vendor;
    private CategoryDto category;
    private ProductResponseDto product;
    private ProductVariantDto variant;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyerEmail = "buyer_stl_" + suffix + "@alight.com";
        vendorEmail = "vendor_stl_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyerEmail)
                .password("Password123!")
                .firstName("Settlement")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer = userRepository.findByEmail(buyerEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Settlement")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Boutique Glassworks " + suffix)
                .description("Handblown crystal and art glass")
                .supportEmail(vendorEmail)
                .supportPhone("+15559990011")
                .legalBusinessName("Boutique Glassworks Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("334455667788")
                .bankIfscCode("HDFC0003344")
                .bankName("HDFC")
                .bankAccountHolderName("Boutique Glassworks Pvt Ltd")
                .pickupContactPerson("Glass Artisan")
                .pickupContactPhone("+15559990011")
                .pickupAddressLine1("Glassworks Lane 5")
                .pickupCity("Firozabad")
                .pickupState("Uttar Pradesh")
                .pickupPostalCode("283203")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Glass & Decor " + suffix)
                .active(true)
                .build());

        WarehouseDto wh = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Glass Hub " + suffix)
                .code("WH-GLS-" + suffix.toUpperCase())
                .addressLine1("Glass Hub 1")
                .city("Firozabad")
                .state("Uttar Pradesh")
                .postalCode("283203")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        product = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Crystal Chandelier " + suffix)
                .basePrice(new BigDecimal("10000.00"))
                .sku("CHAND-" + suffix.toUpperCase())
                .stockQuantity(15)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("CHAND-CRY-" + suffix.toUpperCase())
                        .variantName("Optic Crystal")
                        .price(new BigDecimal("10000.00"))
                        .stockQuantity(15)
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
                .quantity(10)
                .build(), vendorEmail);
    }

    private VendorOrder createOrderAndHoldEscrow() {
        cartService.addItem(buyer.getId(), AddToCartRequest.builder()
                .variantId(variant.getId())
                .quantity(1)
                .build());

        OrderDto order = checkoutService.initiateCheckout(buyer.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Settlement Buyer")
                        .phone("9876543210")
                        .addressLine1("Palace Road 10")
                        .city("Jaipur")
                        .state("Rajasthan")
                        .postalCode("302001")
                        .country("IN")
                        .build())
                .build());

        UUID vendorOrderId = order.getVendorOrders().get(0).getId();
        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId).orElseThrow();

        settlementService.holdInEscrow(vendorOrder);
        return vendorOrder;
    }

    @Test
    @DisplayName("Stage 19: Escrow hold and release with commission & 1% GST TCS statutory deduction")
    void testEscrowHoldAndReleaseWithCommissionAndTcs() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        BigDecimal grossTotal = vendorOrder.getGrandTotal(); // ₹10,000.00

        // 1. Verify Escrow Hold state
        VendorWalletDto wallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(grossTotal, wallet.getPendingBalance());
        assertEquals(BigDecimal.ZERO, wallet.getAvailableBalance());
        assertEquals(grossTotal, wallet.getTotalEarnings());

        // 2. Release Escrow upon delivery
        settlementService.releaseEscrow(vendorOrder.getId());

        // Expected deductions:
        // 10% commission on 10,000 = 1,000.00
        // 1% GST TCS on 10,000 = 100.00
        // Net credited to available balance = 10,000 - 1,000 - 100 = 8,900.00
        VendorWalletDto releasedWallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(BigDecimal.ZERO, releasedWallet.getPendingBalance());
        assertEquals(new BigDecimal("8900.00"), releasedWallet.getAvailableBalance());
        assertEquals(new BigDecimal("1000.00"), releasedWallet.getTotalCommissionPaid());
        assertEquals(new BigDecimal("100.00"), releasedWallet.getTotalTcsPaid());

        // 3. Verify ledger entries
        Page<WalletTransactionDto> txs = settlementService.getVendorTransactions(vendorEmail, PageRequest.of(0, 10));
        assertTrue(txs.getTotalElements() >= 4); // ESCROW_HOLD, ESCROW_RELEASE, COMMISSION_DEDUCTION, TCS_DEDUCTION
        assertTrue(txs.getContent().stream().anyMatch(t -> t.getTransactionType() == WalletTransactionType.ESCROW_RELEASE));
        assertTrue(txs.getContent().stream().anyMatch(t -> t.getTransactionType() == WalletTransactionType.COMMISSION_DEDUCTION));
        assertTrue(txs.getContent().stream().anyMatch(t -> t.getTransactionType() == WalletTransactionType.TCS_DEDUCTION));
    }

    @Test
    @DisplayName("Stage 19: Escrow refund reversal on cancellation/return")
    void testEscrowRefundReversal() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        BigDecimal grossTotal = vendorOrder.getGrandTotal();

        // Reverse escrow due to cancellation
        settlementService.refundEscrow(vendorOrder, grossTotal);

        VendorWalletDto wallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(BigDecimal.ZERO, wallet.getPendingBalance());
        assertEquals(BigDecimal.ZERO, wallet.getAvailableBalance());

        Page<WalletTransactionDto> txs = settlementService.getVendorTransactions(vendorEmail, PageRequest.of(0, 10));
        assertTrue(txs.getContent().stream().anyMatch(t -> t.getTransactionType() == WalletTransactionType.REFUND_REVERSAL));
    }

    @Test
    @DisplayName("Stage 19: Vendor bank details update")
    void testUpdateBankDetails() {
        BankDetailsDto bankDetails = BankDetailsDto.builder()
                .bankAccountNumber("998877665544")
                .bankAccountHolderName("Boutique Glassworks Studio")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .bankBranch("Firozabad Main Branch")
                .build();

        VendorWalletDto updated = settlementService.updateBankDetails(vendorEmail, bankDetails);
        assertEquals("998877665544", updated.getBankAccountNumber());
        assertEquals("HDFC0001234", updated.getBankIfscCode());
        assertEquals("Firozabad Main Branch", updated.getBankBranch());
    }

    @Test
    @DisplayName("Stage 19: Payout request lifecycle - approval with UTR and balance settlement")
    void testPayoutApprovalWorkflow() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        settlementService.releaseEscrow(vendorOrder.getId()); // Net Available = 8,900.00

        // Configure bank details
        settlementService.updateBankDetails(vendorEmail, BankDetailsDto.builder()
                .bankAccountNumber("334455667788")
                .bankAccountHolderName("Boutique Glassworks")
                .bankIfscCode("HDFC0003344")
                .bankName("HDFC")
                .build());

        // 1. Request payout of ₹5,000.00
        VendorPayoutDto payout = settlementService.requestPayout(vendorEmail, PayoutRequestDto.builder()
                .amount(new BigDecimal("5000.00"))
                .notes("Monthly vendor withdrawal")
                .build());

        assertNotNull(payout);
        assertNotNull(payout.getId());
        assertEquals(PayoutStatus.PENDING, payout.getStatus());
        assertEquals(new BigDecimal("5000.00"), payout.getAmount());

        // Available balance should immediately reflect debit (8,900 - 5,000 = 3,900)
        VendorWalletDto debitedWallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(new BigDecimal("3900.00"), debitedWallet.getAvailableBalance());

        // 2. Admin approves payout with bank UTR number
        VendorPayoutDto approvedPayout = settlementService.approvePayout(payout.getId(), "UTR-HDFC-99887711", "Processed via NEFT");
        assertEquals(PayoutStatus.PAID, approvedPayout.getStatus());
        assertEquals("UTR-HDFC-99887711", approvedPayout.getUtrNumber());
        assertNotNull(approvedPayout.getApprovedAt());

        // Total withdrawn should be updated to 5,000
        VendorWalletDto finalWallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(new BigDecimal("5000.00"), finalWallet.getTotalWithdrawn());
        assertEquals(new BigDecimal("3900.00"), finalWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("Stage 19: Payout rejection with balance restoration and ledger adjustment")
    void testPayoutRejectionWorkflow() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        settlementService.releaseEscrow(vendorOrder.getId()); // Net Available = 8,900.00

        settlementService.updateBankDetails(vendorEmail, BankDetailsDto.builder()
                .bankAccountNumber("334455667788")
                .bankAccountHolderName("Boutique Glassworks")
                .bankIfscCode("HDFC0003344")
                .bankName("HDFC")
                .build());

        // Request payout of ₹4,000.00
        VendorPayoutDto payout = settlementService.requestPayout(vendorEmail, PayoutRequestDto.builder()
                .amount(new BigDecimal("4000.00"))
                .notes("Withdrawal attempt")
                .build());

        assertEquals(new BigDecimal("4900.00"), settlementService.getWalletForCurrentUser(vendorEmail).getAvailableBalance());

        // Admin rejects payout
        VendorPayoutDto rejected = settlementService.rejectPayout(payout.getId(), "Bank name mismatch", "Please verify bank holder name");
        assertEquals(PayoutStatus.REJECTED, rejected.getStatus());
        assertEquals("Bank name mismatch", rejected.getRejectionReason());

        // Available balance is restored back to ₹8,900.00
        VendorWalletDto restoredWallet = settlementService.getWalletForCurrentUser(vendorEmail);
        assertEquals(new BigDecimal("8900.00"), restoredWallet.getAvailableBalance());

        // Check adjustment transaction in ledger
        Page<WalletTransactionDto> txs = settlementService.getVendorTransactions(vendorEmail, PageRequest.of(0, 10));
        assertTrue(txs.getContent().stream().anyMatch(t -> t.getTransactionType() == WalletTransactionType.ADJUSTMENT));
    }

    @Test
    @DisplayName("Stage 19: Payout validation rules - insufficient balance and missing bank details")
    void testPayoutValidationRules() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        settlementService.releaseEscrow(vendorOrder.getId()); // Net Available = 8,900.00

        // 1. Missing bank details -> rejected
        assertThrows(BadRequestException.class, () -> settlementService.requestPayout(vendorEmail, PayoutRequestDto.builder()
                .amount(new BigDecimal("1000.00"))
                .build()));

        // Configure bank details
        settlementService.updateBankDetails(vendorEmail, BankDetailsDto.builder()
                .bankAccountNumber("334455667788")
                .bankAccountHolderName("Boutique Glassworks")
                .bankIfscCode("HDFC0003344")
                .bankName("HDFC")
                .build());

        // 2. Exceeds available balance (15,000 > 8,900) -> rejected
        assertThrows(BadRequestException.class, () -> settlementService.requestPayout(vendorEmail, PayoutRequestDto.builder()
                .amount(new BigDecimal("15000.00"))
                .build()));
    }

    @Test
    @DisplayName("Stage 19: Admin Settlement Overview Metrics")
    void testAdminSettlementOverview() {
        VendorOrder vendorOrder = createOrderAndHoldEscrow();
        settlementService.releaseEscrow(vendorOrder.getId());

        SettlementOverviewDto overview = settlementService.getAdminOverview();
        assertNotNull(overview);
        assertTrue(overview.getTotalCommissionsCollected().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(overview.getTotalTcsDeducted().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(overview.getTotalAvailableForPayout().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Stage 19: Tax Compliance & Monthly Marketplace Commission Invoice Generation")
    void testTaxComplianceAndCommissionInvoicing() {
        CommissionInvoiceDTO invoice = taxComplianceService.generateMonthlyCommissionInvoice(vendor.getId(), 9, 2026);
        assertNotNull(invoice);
        assertNotNull(invoice.getInvoiceNumber());
        assertTrue(invoice.getInvoiceNumber().startsWith("INV-"));
        assertEquals(vendor.getId(), invoice.getVendorId());
        assertEquals(9, invoice.getPeriodMonth());
        assertEquals(2026, invoice.getPeriodYear());

        Gstr8SummaryDTO gstr8 = taxComplianceService.generateGstr8Summary("2026-2027", "Q2");
        assertNotNull(gstr8);
        assertEquals("2026-2027", gstr8.getFinancialYear());
        assertEquals("Q2", gstr8.getQuarter());
    }
}
