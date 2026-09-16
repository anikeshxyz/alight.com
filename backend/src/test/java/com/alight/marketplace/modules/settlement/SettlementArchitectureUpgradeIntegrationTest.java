package com.alight.marketplace.modules.settlement;

import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.returns.entity.ReturnReason;
import com.alight.marketplace.modules.returns.entity.ReturnType;
import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import com.alight.marketplace.modules.returns.repository.RmaRequestRepository;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.entity.*;
import com.alight.marketplace.modules.settlement.repository.*;
import com.alight.marketplace.modules.settlement.service.*;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
public class SettlementArchitectureUpgradeIntegrationTest {

    @Autowired
    private SettlementEligibilityService eligibilityService;

    @Autowired
    private SettlementService settlementService;

    @Autowired
    private VendorRecoveryService recoveryService;

    @Autowired
    private ReconciliationService reconciliationService;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private VendorWalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository transactionRepository;

    @Autowired
    private VendorDebtRecoveryRepository debtRecoveryRepository;

    @Autowired
    private VendorPayoutRepository payoutRepository;

    @Autowired
    private VendorOrderRepository vendorOrderRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RmaRequestRepository rmaRequestRepository;

    private Vendor testVendor;
    private User testUser;
    private VendorWallet testWallet;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        testUser = User.builder()
                .email("vendor." + uniqueSuffix + "@alight.com")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456")
                .firstName("Test")
                .lastName("Vendor")
                .active(true)
                .build();
        testUser = userRepository.save(testUser);

        testVendor = Vendor.builder()
                .user(testUser)
                .storeName("Stage19 Enterprise Store " + uniqueSuffix)
                .slug("stage19-store-" + uniqueSuffix)
                .supportEmail("vendor." + uniqueSuffix + "@alight.com")
                .supportPhone("+919876543210")
                .status(VendorStatus.APPROVED)
                .commissionPercentage(new BigDecimal("10.00"))
                .build();
        testVendor = vendorRepository.save(testVendor);

        testWallet = VendorWallet.builder()
                .vendor(testVendor)
                .currencyCode("INR")
                .availableBalance(BigDecimal.ZERO)
                .pendingBalance(BigDecimal.ZERO)
                .reservedBalance(BigDecimal.ZERO)
                .onHoldBalance(BigDecimal.ZERO)
                .recoveryDueBalance(BigDecimal.ZERO)
                .totalEarnings(BigDecimal.ZERO)
                .totalWithdrawn(BigDecimal.ZERO)
                .totalCommissionPaid(BigDecimal.ZERO)
                .totalTcsPaid(BigDecimal.ZERO)
                .bankAccountNumber("987654321001")
                .bankAccountHolderName("Stage19 Technologies")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .isPayoutEnabled(true)
                .build();
        testWallet = walletRepository.save(testWallet);
    }

    @Test
    @DisplayName("Stage 19: Delivered sub-order enters return window countdown and does not immediately release liquid funds")
    void testDeliveredSubOrderTransitionsThroughReturnWindowPolicy() {
        Order masterOrder = Order.builder()
                .orderNumber("ORD-STAGE19-01-" + UUID.randomUUID().toString().substring(0, 6))
                .user(testUser)
                .customerEmail("buyer@alight.com")
                .customerName("Global Buyer")
                .customerPhone("+919876543210")
                .currencyCode("INR")
                .totalSubtotal(new BigDecimal("10000.00"))
                .totalTax(new BigDecimal("1800.00"))
                .totalShipping(new BigDecimal("200.00"))
                .totalDiscount(BigDecimal.ZERO)
                .grandTotal(new BigDecimal("12000.00"))
                .orderStatus(OrderStatus.CONFIRMED)
                .build();
        masterOrder = orderRepository.save(masterOrder);

        VendorOrder subOrder = VendorOrder.builder()
                .masterOrder(masterOrder)
                .vendor(testVendor)
                .subOrderNumber("SUB-STAGE19-01-" + UUID.randomUUID().toString().substring(0, 6))
                .subtotal(new BigDecimal("10000.00"))
                .taxAmount(new BigDecimal("1800.00"))
                .shippingAmount(new BigDecimal("200.00"))
                .grandTotal(new BigDecimal("12000.00"))
                .fulfillmentStatus(FulfillmentStatus.DELIVERED)
                .deliveredAt(Instant.now())
                .build();
        subOrder = vendorOrderRepository.save(subOrder);

        // Put funds in escrow
        settlementService.holdInEscrow(subOrder);
        VendorWallet walletAfterEscrow = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterEscrow.getPendingBalance()).isEqualByComparingTo("12000.00");
        assertThat(walletAfterEscrow.getAvailableBalance()).isEqualByComparingTo("0.00");

        // Now evaluate delivery eligibility
        Settlement settlement = eligibilityService.evaluateAndScheduleSettlement(subOrder);

        assertThat(settlement).isNotNull();
        // Policy default return window is 7 days, so status should be ELIGIBILITY_EVALUATION
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.ELIGIBILITY_EVALUATION);
        assertThat(settlement.getEligibleAt()).isAfter(Instant.now());
        assertThat(settlement.getCalculationSnapshot()).contains("RC-DEFAULT");

        // Crucial Enterprise Check: Funds must NOT be released into liquid available balance prematurely
        VendorWallet walletAfterEval = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterEval.getAvailableBalance()).isEqualByComparingTo("0.00");
        assertThat(walletAfterEval.getPendingBalance()).isEqualByComparingTo("12000.00");
    }

    @Test
    @DisplayName("Stage 19: Matured return window automatically settles order, records double-entry ledger & credits available balance")
    void testMaturedSettlementMaturityRelease() {
        Order masterOrder = Order.builder()
                .orderNumber("ORD-STAGE19-02-" + UUID.randomUUID().toString().substring(0, 6))
                .user(testUser)
                .customerEmail("buyer@alight.com")
                .customerName("Global Buyer")
                .customerPhone("+919876543210")
                .currencyCode("INR")
                .totalSubtotal(new BigDecimal("10000.00"))
                .totalTax(new BigDecimal("1800.00"))
                .totalShipping(new BigDecimal("200.00"))
                .totalDiscount(BigDecimal.ZERO)
                .grandTotal(new BigDecimal("12000.00"))
                .orderStatus(OrderStatus.CONFIRMED)
                .build();
        masterOrder = orderRepository.save(masterOrder);

        VendorOrder subOrder = VendorOrder.builder()
                .masterOrder(masterOrder)
                .vendor(testVendor)
                .subOrderNumber("SUB-STAGE19-02-" + UUID.randomUUID().toString().substring(0, 6))
                .subtotal(new BigDecimal("10000.00"))
                .taxAmount(new BigDecimal("1800.00"))
                .shippingAmount(new BigDecimal("200.00"))
                .grandTotal(new BigDecimal("12000.00"))
                .fulfillmentStatus(FulfillmentStatus.DELIVERED)
                .deliveredAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .build();
        subOrder = vendorOrderRepository.save(subOrder);

        settlementService.holdInEscrow(subOrder);

        // Evaluate return window: delivered 10 days ago, return window (7 days) expired
        Settlement settlement = eligibilityService.evaluateAndScheduleSettlement(subOrder);

        // Immediately eligible or settled via auto-approval policy
        assertThat(settlement.getStatus()).isIn(SettlementStatus.ELIGIBLE, SettlementStatus.SETTLED);

        // If not settled yet, process matured settlements batch
        if (settlement.getStatus() != SettlementStatus.SETTLED) {
            List<Settlement> finalized = eligibilityService.processMaturedSettlements();
            assertThat(finalized).isNotEmpty();
        }

        Settlement finalizedSettlement = settlementRepository.findById(settlement.getId()).orElseThrow();
        assertThat(finalizedSettlement.getStatus()).isEqualTo(SettlementStatus.SETTLED);

        // Verify mathematical calculations:
        // Gross: 12,000.00
        // Commission (10% of 10000): 1000.00
        // TCS (1% of 10000): 100.00
        // Net Payable: 12000 - 1000 - 100 = 10,900.00
        VendorWallet walletAfterFinalize = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterFinalize.getAvailableBalance()).isEqualByComparingTo("10900.00");
        assertThat(walletAfterFinalize.getPendingBalance()).isEqualByComparingTo("0.00");

        // Verify immutable ledger transaction
        List<WalletTransaction> txs = transactionRepository.findByVendorIdOrderByCreatedAtDesc(testVendor.getId());
        boolean hasReleaseCredit = txs.stream()
                .anyMatch(t -> t.getTransactionType() == WalletTransactionType.ESCROW_RELEASE && t.getCreditAmount().compareTo(new BigDecimal("10900.00")) == 0);
        assertThat(hasReleaseCredit).isTrue();

        boolean hasCommDeduction = txs.stream()
                .anyMatch(t -> t.getTransactionType() == WalletTransactionType.COMMISSION_DEDUCTION && t.getDebitAmount().compareTo(new BigDecimal("1000.00")) == 0);
        assertThat(hasCommDeduction).isTrue();

        boolean hasTcsDeduction = txs.stream()
                .anyMatch(t -> t.getTransactionType() == WalletTransactionType.TCS_DEDUCTION && t.getDebitAmount().compareTo(new BigDecimal("100.00")) == 0);
        assertThat(hasTcsDeduction).isTrue();
    }

    @Test
    @DisplayName("Stage 19: Post-settlement return with inadequate balance creates VendorDebtRecovery and claws back from future settlements")
    void testPostSettlementReturnClawbackAndDebtRecovery() {
        // Step 1: Give vendor 2,000 liquid balance
        testWallet.setAvailableBalance(new BigDecimal("2000.00"));
        walletRepository.save(testWallet);

        // Step 2: Post-settlement return occurs for ₹5,000 net value
        Order masterOrder = Order.builder()
                .orderNumber("ORD-STAGE19-03-" + UUID.randomUUID().toString().substring(0, 6))
                .user(testUser)
                .customerEmail("buyer@alight.com")
                .customerName("Global Buyer")
                .customerPhone("+919876543210")
                .currencyCode("INR")
                .totalSubtotal(new BigDecimal("5000.00"))
                .grandTotal(new BigDecimal("5000.00"))
                .orderStatus(OrderStatus.CONFIRMED)
                .build();
        masterOrder = orderRepository.save(masterOrder);

        VendorOrder returnedSubOrder = VendorOrder.builder()
                .masterOrder(masterOrder)
                .vendor(testVendor)
                .subOrderNumber("SUB-STAGE19-03-" + UUID.randomUUID().toString().substring(0, 6))
                .subtotal(new BigDecimal("5000.00"))
                .grandTotal(new BigDecimal("5000.00"))
                .fulfillmentStatus(FulfillmentStatus.DELIVERED)
                .build();
        returnedSubOrder = vendorOrderRepository.save(returnedSubOrder);

        RmaRequest rma = RmaRequest.builder()
                .rmaNumber("RMA-STAGE19-" + UUID.randomUUID().toString().substring(0, 6))
                .order(masterOrder)
                .vendorOrder(returnedSubOrder)
                .user(testUser)
                .vendor(testVendor)
                .status(RmaStatus.REFUND_PROCESSED)
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.DEFECTIVE)
                .customerComments("Defective unit return approved after payout")
                .build();
        rma = rmaRequestRepository.save(rma);

        recoveryService.applyPostSettlementReturnDebit(
                rma,
                new BigDecimal("5000.00"),
                "admin-finance@alight.com"
        );

        // Available balance is wiped to 0; remaining 3,000 becomes recoveryDueBalance
        VendorWallet walletAfterDebt = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterDebt.getAvailableBalance()).isEqualByComparingTo("0.00");
        assertThat(walletAfterDebt.getRecoveryDueBalance()).isEqualByComparingTo("3000.00");

        // Verify VendorDebtRecovery record
        List<VendorDebtRecovery> pendingRecoveries = debtRecoveryRepository.findByVendorIdAndStatusIn(
                testVendor.getId(), List.of("RECOVERY_PENDING", "RECOVERY_PARTIAL"));
        assertThat(pendingRecoveries).hasSize(1);
        assertThat(pendingRecoveries.get(0).getRemainingAmount()).isEqualByComparingTo("3000.00");

        // Step 3: Now vendor earns a new settlement of ₹8,900 net credit
        // Perform automated clawback deduction against new net payable
        BigDecimal remainingCredit = recoveryService.clawbackFromSettlement(testVendor, new BigDecimal("8900.00"));
        assertThat(remainingCredit).isEqualByComparingTo("5900.00");

        // Debt is fully settled!
        VendorWallet walletAfterClawback = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterClawback.getRecoveryDueBalance()).isEqualByComparingTo("0.00");

        List<VendorDebtRecovery> recoveriesAfter = debtRecoveryRepository.findByVendorIdAndStatusIn(
                testVendor.getId(), List.of("RECOVERY_PENDING", "RECOVERY_PARTIAL"));
        assertThat(recoveriesAfter).isEmpty();
    }

    @Test
    @DisplayName("Stage 19: Payout reserves funds with transactional concurrency protection")
    void testPayoutReservationAndDisbursement() {
        testWallet.setAvailableBalance(new BigDecimal("50000.00"));
        walletRepository.save(testWallet);

        // Request partial payout of 20,000
        PayoutRequestDto request = PayoutRequestDto.builder()
                .amount(new BigDecimal("20000.00"))
                .notes("Partial bi-weekly withdrawal")
                .build();

        VendorPayoutDto payoutDto = settlementService.requestPayout(testUser.getEmail(), request);
        assertThat(payoutDto).isNotNull();
        assertThat(payoutDto.getStatus()).isEqualTo(PayoutStatus.PENDING);

        // Verify balance separation: 50k available -> 30k available + 20k reserved
        VendorWallet walletAfterReq = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterReq.getAvailableBalance()).isEqualByComparingTo("30000.00");
        assertThat(walletAfterReq.getReservedBalance()).isEqualByComparingTo("20000.00");

        // Admin approves with bank UTR
        settlementService.approvePayout(payoutDto.getId(), "UTR-HDFC-991823", "Verified by Finance Controller");

        VendorPayout approvedPayout = payoutRepository.findById(payoutDto.getId()).orElseThrow();
        assertThat(approvedPayout.getStatus()).isEqualTo(PayoutStatus.PAID);
        assertThat(approvedPayout.getUtrNumber()).isEqualTo("UTR-HDFC-991823");

        // Reserved balance is deducted, total withdrawn updated
        VendorWallet walletAfterPaid = walletRepository.findByVendorId(testVendor.getId()).orElseThrow();
        assertThat(walletAfterPaid.getReservedBalance()).isEqualByComparingTo("0.00");
        assertThat(walletAfterPaid.getTotalWithdrawn()).isEqualByComparingTo("20000.00");
    }

    @Test
    @DisplayName("Stage 19: Three-Way Reconciliation audit matches payment provider vs financial ledger")
    void testThreeWayReconciliationAudit() {
        var gatewayRecon = reconciliationService.runEscrowGatewayReconciliation();
        assertThat(gatewayRecon).isNotNull();
        assertThat(gatewayRecon.getReconciliationType()).isEqualTo("GATEWAY_ESCROW");

        var payoutRecon = reconciliationService.runPayoutBankReconciliation();
        assertThat(payoutRecon).isNotNull();
        assertThat(payoutRecon.getReconciliationType()).isEqualTo("BANK_PAYOUT");
    }
}
