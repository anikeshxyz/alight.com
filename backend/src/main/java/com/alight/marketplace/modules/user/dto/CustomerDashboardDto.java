package com.alight.marketplace.modules.user.dto;

import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.returns.dto.RmaResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDashboardDto {

    private UserProfileDto profile;
    private DashboardMetrics metrics;

    @Builder.Default
    private List<OrderDto> recentOrders = new ArrayList<>();

    @Builder.Default
    private List<RmaResponseDto> recentReturns = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardMetrics {
        private long totalOrders;
        private long activeOrders;
        private long wishlistCount;
        private long openTicketsCount;
        private long activeQuotesCount;
        private long unreadNotificationsCount;
        private long savedAddressesCount;
    }
}
