package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.settlement.dto.BankDetailsDto;
import com.alight.marketplace.modules.settlement.dto.PayoutRequestDto;
import com.alight.marketplace.modules.settlement.dto.VendorPayoutDto;
import com.alight.marketplace.modules.settlement.dto.VendorWalletDto;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.VendorPayout;
import com.alight.marketplace.modules.settlement.entity.VendorWallet;
import com.alight.marketplace.modules.settlement.entity.WalletTransaction;
import com.alight.marketplace.modules.settlement.repository.VendorPayoutRepository;
import com.alight.marketplace.modules.settlement.repository.VendorWalletRepository;
import com.alight.marketplace.modules.settlement.repository.WalletTransactionRepository;
import com.alight.marketplace.modules.settlement.service.impl.SettlementServiceImpl;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.alight.marketplace.modules.settlement.service.SettlementEligibilityService;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private VendorWalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    @Mock
    private VendorPayoutRepository payoutRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorOrderRepository vendorOrderRepository;

    @Mock
    private SettlementEligibilityService eligibilityService;

    @InjectMocks
    private SettlementServiceImpl settlementService;

    private User testUser;
    private Vendor testVendor;
    private VendorWallet testWallet;
    private VendorOrder testVendorOrder;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("seller@alight.com")
                .firstName("Seller")
                .lastName("Demo")
                .build();

        testVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .storeName("Apex Electronics")
                .commissionPercentage(new BigDecimal("10.00"))
                .build();

        testWallet = VendorWallet.builder()
                .id(UUID.randomUUID())
                .vendor(testVendor)
                .pendingBalance(BigDecimal.ZERO)
                .availableBalance(new BigDecimal("50000.00"))
                .reservedBalance(BigDecimal.ZERO)
                .onHoldBalance(BigDecimal.ZERO)
                .recoveryDueBalance(BigDecimal.ZERO)
                .totalEarnings(BigDecimal.ZERO)
                .totalWithdrawn(BigDecimal.ZERO)
                .totalCommissionPaid(BigDecimal.ZERO)
                .totalTcsPaid(BigDecimal.ZERO)
                .currencyCode("INR")
                .bankAccountNumber("1234567890")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .isPayoutEnabled(true)
                .build();

        testVendorOrder = VendorOrder.builder()
                .id(UUID.randomUUID())
                .vendor(testVendor)
                .subOrderNumber("ORD-2026-TEST01-V1")
                .subtotal(new BigDecimal("10000.00"))
                .taxAmount(new BigDecimal("1800.00"))
                .shippingAmount(new BigDecimal("200.00"))
                .grandTotal(new BigDecimal("12000.00"))
                .build();
    }

    @Test
    void testHoldInEscrow_Success() {
        when(walletRepository.findByVendorId(testVendor.getId())).thenReturn(Optional.of(testWallet));
        when(walletRepository.save(any(VendorWallet.class))).thenReturn(testWallet);
        when(transactionRepository.save(any(WalletTransaction.class))).thenReturn(new WalletTransaction());

        settlementService.holdInEscrow(testVendorOrder);

        assertThat(testWallet.getPendingBalance()).isEqualTo(new BigDecimal("12000.00"));
        verify(walletRepository).save(testWallet);
        verify(transactionRepository).save(any(WalletTransaction.class));
    }

    @Test
    void testReleaseEscrow_RoutesToEligibilityService() {
        when(vendorOrderRepository.findById(testVendorOrder.getId())).thenReturn(Optional.of(testVendorOrder));

        settlementService.releaseEscrow(testVendorOrder.getId());

        verify(eligibilityService).evaluateAndScheduleSettlement(testVendorOrder);
    }

    @Test
    void testRequestPayout_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(vendorRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testVendor));
        when(walletRepository.findByVendorIdForUpdate(testVendor.getId())).thenReturn(Optional.of(testWallet));
        when(walletRepository.save(any(VendorWallet.class))).thenReturn(testWallet);
        when(payoutRepository.save(any(VendorPayout.class))).thenAnswer(invocation -> {
            VendorPayout p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        PayoutRequestDto request = PayoutRequestDto.builder()
                .amount(new BigDecimal("15000.00"))
                .notes("Weekly withdrawal")
                .build();

        VendorPayoutDto response = settlementService.requestPayout(testUser.getEmail(), request);

        assertThat(response).isNotNull();
        assertThat(response.getAmount()).isEqualTo(new BigDecimal("15000.00"));
        assertThat(testWallet.getAvailableBalance()).isEqualTo(new BigDecimal("35000.00"));
        assertThat(testWallet.getReservedBalance()).isEqualTo(new BigDecimal("15000.00"));
    }
}
