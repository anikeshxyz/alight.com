package com.alight.marketplace.modules.analytics.service;

import com.alight.marketplace.modules.analytics.dto.AdminAnalyticsOverviewDTO;
import com.alight.marketplace.modules.analytics.dto.VendorAnalyticsOverviewDTO;
import com.alight.marketplace.modules.analytics.service.impl.AnalyticsServiceImpl;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.settlement.entity.VendorWallet;
import com.alight.marketplace.modules.settlement.repository.VendorWalletRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private VendorOrderRepository vendorOrderRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorWalletRepository walletRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private Vendor vendor;
    private UUID vendorId;

    @BeforeEach
    void setUp() {
        vendorId = UUID.randomUUID();
        vendor = Vendor.builder()
                .id(vendorId)
                .storeName("Apex Electronics")
                .build();
    }

    @Test
    @DisplayName("Should generate admin executive analytics overview")
    void shouldGenerateAdminOverview() {
        when(orderRepository.findAll()).thenReturn(List.of());
        when(walletRepository.findAll()).thenReturn(List.of());
        when(vendorRepository.findAll()).thenReturn(List.of(vendor));
        when(userRepository.count()).thenReturn(10L);
        when(categoryRepository.findAll()).thenReturn(List.of());

        AdminAnalyticsOverviewDTO overview = analyticsService.getAdminAnalyticsOverview();

        assertThat(overview).isNotNull();
        assertThat(overview.getGrossMerchandiseValue()).isNotNull();
        assertThat(overview.getRevenueTrajectory()).isNotEmpty();
        assertThat(overview.getActiveVendorsCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should generate vendor business analytics overview")
    void shouldGenerateVendorOverview() {
        VendorWallet wallet = VendorWallet.builder()
                .id(UUID.randomUUID())
                .vendor(vendor)
                .totalEarnings(new BigDecimal("300000.00"))
                .totalCommissionPaid(new BigDecimal("24000.00"))
                .totalTcsPaid(new BigDecimal("3000.00"))
                .pendingBalance(new BigDecimal("25000.00"))
                .availableBalance(new BigDecimal("50000.00"))
                .build();

        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(walletRepository.findByVendorId(vendorId)).thenReturn(Optional.of(wallet));

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId);

        assertThat(overview).isNotNull();
        assertThat(overview.getTotalGrossSales()).isEqualByComparingTo("300000.00");
        assertThat(overview.getTotalCommissionPaid()).isEqualByComparingTo("24000.00");
        assertThat(overview.getNetEarnings()).isEqualByComparingTo("273000.00");
        assertThat(overview.getMonthlySales()).isNotEmpty();
    }
}
