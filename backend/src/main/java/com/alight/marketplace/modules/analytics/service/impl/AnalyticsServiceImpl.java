package com.alight.marketplace.modules.analytics.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.analytics.dto.*;
import com.alight.marketplace.modules.analytics.service.AnalyticsService;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import com.alight.marketplace.modules.returns.repository.RmaRequestRepository;
import com.alight.marketplace.modules.review.repository.ReviewRepository;
import com.alight.marketplace.modules.settlement.entity.VendorWallet;
import com.alight.marketplace.modules.settlement.repository.VendorWalletRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final OrderRepository orderRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final VendorWalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final RmaRequestRepository rmaRequestRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminAnalyticsOverviewDTO getAdminAnalyticsOverview() {
        List<Order> orders = orderRepository.findAll();
        List<VendorWallet> wallets = walletRepository.findAll();
        List<Vendor> vendors = vendorRepository.findAll();
        long customerCount = userRepository.count();

        BigDecimal gmv = BigDecimal.ZERO;
        long completedOrders = 0;

        for (Order o : orders) {
            if (o.getGrandTotal() != null) {
                gmv = gmv.add(o.getGrandTotal());
            }
            if (o.getOrderStatus() == OrderStatus.DELIVERED || o.getOrderStatus() == OrderStatus.CONFIRMED) {
                completedOrders++;
            }
        }

        BigDecimal netPlatformRevenue = BigDecimal.ZERO;
        BigDecimal escrowInTransit = BigDecimal.ZERO;
        BigDecimal totalPayoutsDisbursed = BigDecimal.ZERO;

        for (VendorWallet w : wallets) {
            netPlatformRevenue = netPlatformRevenue.add(w.getTotalCommissionPaid() != null ? w.getTotalCommissionPaid() : BigDecimal.ZERO);
            escrowInTransit = escrowInTransit.add(w.getPendingBalance() != null ? w.getPendingBalance() : BigDecimal.ZERO);
            totalPayoutsDisbursed = totalPayoutsDisbursed.add(w.getTotalWithdrawn() != null ? w.getTotalWithdrawn() : BigDecimal.ZERO);
        }

        double aov = orders.isEmpty() ? 0.0 : gmv.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP).doubleValue();

        long totalReturns = rmaRequestRepository.count();
        double returnDisputeRate = orders.isEmpty() ? 0.0 : ((double) totalReturns / orders.size()) * 100.0;

        // 1. Monthly revenue trajectory derived strictly from actual order timestamps
        List<RevenueTrajectoryDTO> trajectory = new ArrayList<>();
        if (!orders.isEmpty()) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneId.of("Asia/Kolkata"));
            Map<String, List<Order>> ordersByMonth = orders.stream()
                    .filter(o -> o.getCreatedAt() != null)
                    .collect(Collectors.groupingBy(o -> fmt.format(o.getCreatedAt()), LinkedHashMap::new, Collectors.toList()));

            ordersByMonth.forEach((month, monthOrders) -> {
                BigDecimal monthGmv = monthOrders.stream()
                        .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal monthComm = monthOrders.stream()
                        .flatMap(o -> o.getVendorOrders() != null ? o.getVendorOrders().stream() : Stream.empty())
                        .map(vo -> vo.getCommissionAmount() != null ? vo.getCommissionAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                trajectory.add(RevenueTrajectoryDTO.builder()
                        .periodLabel(month)
                        .gmv(monthGmv)
                        .netCommission(monthComm)
                        .orderCount(monthOrders.size())
                        .build());
            });
        }

        // 2. Category sales share
        List<CategorySalesShareDTO> categories = new ArrayList<>();

        // 3. Top vendors leaderboard derived from real vendor orders
        List<VendorLeaderboardDTO> topVendors = new ArrayList<>();
        for (Vendor v : vendors) {
            List<VendorOrder> vOrders = vendorOrderRepository.findByVendorId(v.getId());
            if (!vOrders.isEmpty()) {
                BigDecimal vSales = vOrders.stream()
                        .map(vo -> vo.getGrandTotal() != null ? vo.getGrandTotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                long delivered = vOrders.stream()
                        .filter(vo -> vo.getFulfillmentStatus() == FulfillmentStatus.DELIVERED)
                        .count();
                double fulfillmentRate = ((double) delivered / vOrders.size()) * 100.0;
                Double avgRating = reviewRepository.getAverageRatingForVendor(v.getId());

                topVendors.add(VendorLeaderboardDTO.builder()
                        .vendorId(v.getId())
                        .storeName(v.getStoreName())
                        .grossSales(vSales)
                        .ordersFulfilled((int) delivered)
                        .fulfillmentRate(Math.round(fulfillmentRate * 100.0) / 100.0)
                        .customerRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                        .build());
            }
        }
        topVendors.sort((a, b) -> b.getGrossSales().compareTo(a.getGrossSales()));

        long activeVendors = vendors.stream()
                .filter(v -> v.getStatus() == VendorStatus.ACTIVE)
                .count();

        return AdminAnalyticsOverviewDTO.builder()
                .grossMerchandiseValue(gmv)
                .netPlatformRevenue(netPlatformRevenue)
                .escrowInTransit(escrowInTransit)
                .totalPayoutsDisbursed(totalPayoutsDisbursed)
                .totalOrdersCount(orders.size())
                .completedOrdersCount(completedOrders)
                .activeVendorsCount(activeVendors)
                .activeCustomersCount(customerCount)
                .averageOrderValue(aov)
                .returnDisputeRate(Math.round(returnDisputeRate * 100.0) / 100.0)
                .revenueTrajectory(trajectory)
                .topCategories(categories)
                .topVendors(topVendors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VendorAnalyticsOverviewDTO getVendorAnalyticsOverview(UUID vendorId) {
        vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));

        VendorWallet wallet = walletRepository.findByVendorId(vendorId).orElse(null);
        List<VendorOrder> vendorOrders = vendorOrderRepository.findByVendorId(vendorId);

        BigDecimal calculatedGross = vendorOrders.stream()
                .map(vo -> vo.getGrandTotal() != null ? vo.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal calculatedCommission = vendorOrders.stream()
                .map(vo -> vo.getCommissionAmount() != null ? vo.getCommissionAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gross = (wallet != null && wallet.getTotalEarnings() != null && wallet.getTotalEarnings().compareTo(BigDecimal.ZERO) > 0)
                ? wallet.getTotalEarnings() : calculatedGross;
        BigDecimal commission = (wallet != null && wallet.getTotalCommissionPaid() != null && wallet.getTotalCommissionPaid().compareTo(BigDecimal.ZERO) > 0)
                ? wallet.getTotalCommissionPaid() : calculatedCommission;
        BigDecimal tcs = (wallet != null && wallet.getTotalTcsPaid() != null) ? wallet.getTotalTcsPaid() : BigDecimal.ZERO;
        BigDecimal net = gross.subtract(commission).subtract(tcs).max(BigDecimal.ZERO);
        BigDecimal pending = (wallet != null && wallet.getPendingBalance() != null) ? wallet.getPendingBalance() : BigDecimal.ZERO;
        BigDecimal available = (wallet != null && wallet.getAvailableBalance() != null) ? wallet.getAvailableBalance() : BigDecimal.ZERO;

        long fulfilledCount = vendorOrders.stream()
                .filter(vo -> vo.getFulfillmentStatus() == FulfillmentStatus.DELIVERED)
                .count();
        double fulfillmentRate = vendorOrders.isEmpty() ? 0.0 : ((double) fulfilledCount / vendorOrders.size()) * 100.0;

        long returnCount = rmaRequestRepository.countByVendorIdAndStatus(vendorId, RmaStatus.APPROVED)
                + rmaRequestRepository.countByVendorIdAndStatus(vendorId, RmaStatus.REFUNDED);
        double returnRate = vendorOrders.isEmpty() ? 0.0 : ((double) returnCount / vendorOrders.size()) * 100.0;

        Double avgRating = reviewRepository.getAverageRatingForVendor(vendorId);

        List<RevenueTrajectoryDTO> monthlySales = new ArrayList<>();
        if (!vendorOrders.isEmpty()) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneId.of("Asia/Kolkata"));
            Map<String, List<VendorOrder>> ordersByMonth = vendorOrders.stream()
                    .filter(vo -> vo.getCreatedAt() != null)
                    .collect(Collectors.groupingBy(vo -> fmt.format(vo.getCreatedAt()), LinkedHashMap::new, Collectors.toList()));

            ordersByMonth.forEach((month, mOrders) -> {
                BigDecimal mGross = mOrders.stream()
                        .map(vo -> vo.getGrandTotal() != null ? vo.getGrandTotal() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal mComm = mOrders.stream()
                        .map(vo -> vo.getCommissionAmount() != null ? vo.getCommissionAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                monthlySales.add(RevenueTrajectoryDTO.builder()
                        .periodLabel(month)
                        .gmv(mGross)
                        .netCommission(mComm)
                        .orderCount(mOrders.size())
                        .build());
            });
        }

        return VendorAnalyticsOverviewDTO.builder()
                .totalGrossSales(gross)
                .netEarnings(net)
                .totalCommissionPaid(commission)
                .totalTcsDeducted(tcs)
                .pendingEscrow(pending)
                .availableBalance(available)
                .totalOrdersCount(vendorOrders.size())
                .fulfillmentRate(Math.round(fulfillmentRate * 100.0) / 100.0)
                .returnRate(Math.round(returnRate * 100.0) / 100.0)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .monthlySales(monthlySales)
                .build();
    }
}
