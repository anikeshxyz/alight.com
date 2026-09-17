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

    @Mock
    private com.alight.marketplace.modules.returns.repository.RmaRequestRepository rmaRequestRepository;

    @Mock
    private com.alight.marketplace.modules.review.repository.ReviewRepository reviewRepository;

    @Mock
    private com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository warehouseStockRepository;

    @Mock
    private com.alight.marketplace.modules.quote.repository.QuoteRequestRepository quoteRequestRepository;

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
                .status(com.alight.marketplace.modules.vendor.entity.VendorStatus.APPROVED)
                .build();
    }

    @Test
    @DisplayName("Should generate admin executive analytics overview")
    void shouldGenerateAdminOverview() {
        com.alight.marketplace.modules.order.entity.Order sampleOrder = com.alight.marketplace.modules.order.entity.Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-1001")
                .customerEmail("customer@alight.com")
                .customerName("John Doe")
                .grandTotal(new BigDecimal("5000.00"))
                .orderStatus(com.alight.marketplace.modules.order.entity.OrderStatus.DELIVERED)
                .createdAt(java.time.Instant.now())
                .build();

        when(orderRepository.findAll()).thenReturn(List.of(sampleOrder));
        when(walletRepository.findAll()).thenReturn(List.of());
        when(vendorRepository.findAll()).thenReturn(List.of(vendor));
        when(userRepository.count()).thenReturn(10L);

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

        com.alight.marketplace.modules.order.entity.VendorOrder sampleVendorOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-1001-A")
                .vendor(vendor)
                .grandTotal(new BigDecimal("5000.00"))
                .commissionAmount(new BigDecimal("500.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.DELIVERED)
                .createdAt(java.time.Instant.now())
                .build();

        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(walletRepository.findByVendorId(vendorId)).thenReturn(Optional.of(wallet));
        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of(sampleVendorOrder));

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId);

        assertThat(overview).isNotNull();
        assertThat(overview.getTotalGrossSales()).isEqualByComparingTo("300000.00");
        assertThat(overview.getTotalCommissionPaid()).isEqualByComparingTo("24000.00");
        assertThat(overview.getNetEarnings()).isEqualByComparingTo("273000.00");
        assertThat(overview.getMonthlySales()).isNotEmpty();
    }

    @Test
    @DisplayName("Should filter vendor analytics by 7d range and calculate deltas")
    void shouldFilterVendorAnalyticsByRange7d() {
        java.time.Instant now = java.time.Instant.now();

        // Current period order (3 days ago)
        com.alight.marketplace.modules.order.entity.VendorOrder currentOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-CURR-1")
                .vendor(vendor)
                .grandTotal(new BigDecimal("10000.00"))
                .commissionAmount(new BigDecimal("1000.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.DELIVERED)
                .createdAt(now.minus(3, java.time.temporal.ChronoUnit.DAYS))
                .build();

        // Previous period order (10 days ago)
        com.alight.marketplace.modules.order.entity.VendorOrder previousOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-PREV-1")
                .vendor(vendor)
                .grandTotal(new BigDecimal("5000.00"))
                .commissionAmount(new BigDecimal("500.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.DELIVERED)
                .createdAt(now.minus(10, java.time.temporal.ChronoUnit.DAYS))
                .build();

        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of(currentOrder, previousOrder));

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId, "7d");

        assertThat(overview).isNotNull();
        assertThat(overview.getRange()).isEqualTo("7d");
        assertThat(overview.getTotalGrossSales()).isEqualByComparingTo("10000.00");
        assertThat(overview.getNetEarnings()).isEqualByComparingTo("9000.00");
        assertThat(overview.getTotalOrdersCount()).isEqualTo(1);
        // Current: 10000, Previous: 5000 -> Delta = +100.0%
        assertThat(overview.getGrossSalesDelta()).isNotNull();
        assertThat(overview.getGrossSalesDelta()).isEqualByComparingTo("100.0");
        // Order volume: Current 1, Previous 1 -> Delta = 0.0%
        assertThat(overview.getOrderVolumeDelta()).isNotNull();
        assertThat(overview.getOrderVolumeDelta()).isEqualByComparingTo("0.0");
        assertThat(overview.getFulfillmentRate()).isEqualTo(100.0);
        assertThat(overview.getCancellationRate()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Should return null delta when previous period has zero sales")
    void shouldReturnNullDeltaWhenPreviousPeriodZeroSales() {
        java.time.Instant now = java.time.Instant.now();

        com.alight.marketplace.modules.order.entity.VendorOrder currentOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-CURR-2")
                .vendor(vendor)
                .grandTotal(new BigDecimal("8000.00"))
                .commissionAmount(new BigDecimal("800.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.DELIVERED)
                .createdAt(now.minus(2, java.time.temporal.ChronoUnit.DAYS))
                .build();

        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of(currentOrder));

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId, "7d");

        assertThat(overview).isNotNull();
        assertThat(overview.getTotalGrossSales()).isEqualByComparingTo("8000.00");
        // Previous period = 0 -> Delta must be null rather than division by zero or fabricated
        assertThat(overview.getGrossSalesDelta()).isNull();
        assertThat(overview.getOrderVolumeDelta()).isNull();
    }

    @Test
    @DisplayName("Should calculate cancellation rate from actual orders")
    void shouldCalculateCancellationRateFromActualOrders() {
        java.time.Instant now = java.time.Instant.now();

        com.alight.marketplace.modules.order.entity.VendorOrder deliveredOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-DELIV-1")
                .vendor(vendor)
                .grandTotal(new BigDecimal("4000.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.DELIVERED)
                .createdAt(now.minus(5, java.time.temporal.ChronoUnit.DAYS))
                .build();

        com.alight.marketplace.modules.order.entity.VendorOrder cancelledOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .subOrderNumber("VORD-CANC-1")
                .vendor(vendor)
                .grandTotal(new BigDecimal("4000.00"))
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.CANCELLED)
                .createdAt(now.minus(4, java.time.temporal.ChronoUnit.DAYS))
                .build();

        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of(deliveredOrder, cancelledOrder));

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId, "30d");

        assertThat(overview).isNotNull();
        assertThat(overview.getTotalOrdersCount()).isEqualTo(2);
        // 1 cancelled out of 2 = 50.0%
        assertThat(overview.getCancellationRate()).isEqualTo(50.0);
        // 1 delivered out of 2 = 50.0%
        assertThat(overview.getFulfillmentRate()).isEqualTo(50.0);
    }

    @Test
    @DisplayName("Should handle invalid range safely by defaulting to 30d")
    void shouldHandleInvalidRangeSafely() {
        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of());

        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId, "invalid_range");

        assertThat(overview).isNotNull();
        assertThat(overview.getRange()).isEqualTo("30d");
        assertThat(overview.getTotalGrossSales()).isEqualByComparingTo("0.00");
        assertThat(overview.getTotalOrdersCount()).isEqualTo(0);
        assertThat(overview.getGrossSalesDelta()).isNull();
        assertThat(overview.getCancellationRate()).isNull();
        assertThat(overview.getFulfillmentRate()).isNull();
    }

    @Test
    @DisplayName("Should return vendor operational badges with authentic counts")
    void shouldReturnVendorOperationalBadges() {
        com.alight.marketplace.modules.order.entity.VendorOrder pendingOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .vendor(vendor)
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.PENDING)
                .build();

        com.alight.marketplace.modules.order.entity.VendorOrder shippedOrder = com.alight.marketplace.modules.order.entity.VendorOrder.builder()
                .id(UUID.randomUUID())
                .vendor(vendor)
                .fulfillmentStatus(com.alight.marketplace.modules.order.entity.FulfillmentStatus.SHIPPED)
                .build();

        when(vendorOrderRepository.findByVendorId(vendorId)).thenReturn(List.of(pendingOrder, shippedOrder));

        com.alight.marketplace.modules.analytics.dto.VendorOperationalBadgesDTO badges =
                analyticsService.getVendorOperationalBadges(vendorId);

        assertThat(badges).isNotNull();
        assertThat(badges.getOrders()).isEqualTo(1L);
        assertThat(badges.getFulfillment()).isEqualTo(1L);
        assertThat(badges.getLowStock()).isEqualTo(0L);
        assertThat(badges.getOutOfStock()).isEqualTo(0L);
        assertThat(badges.getReturns()).isEqualTo(0L);
        assertThat(badges.getQuotes()).isEqualTo(0L);
    }
}
