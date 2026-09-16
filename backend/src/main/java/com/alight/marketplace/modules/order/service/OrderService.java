package com.alight.marketplace.modules.order.service;

import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.dto.UpdateFulfillmentRequest;
import com.alight.marketplace.modules.order.dto.VendorOrderDto;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrderService {
    OrderDto getOrderByNumber(String orderNumber, UUID userId, boolean isAdmin);
    Page<OrderDto> getCustomerOrders(UUID userId, Pageable pageable);
    Page<OrderDto> getCustomerOrders(UUID userId, OrderStatus status, Pageable pageable);
    Page<VendorOrderDto> getVendorOrders(UUID vendorUserId, FulfillmentStatus status, Pageable pageable);
    VendorOrderDto updateVendorOrderFulfillment(UUID vendorUserId, UUID vendorOrderId, UpdateFulfillmentRequest request);
    Page<OrderDto> getAllOrdersAdmin(OrderStatus status, Pageable pageable);
    OrderDto updateOrderStatusAdmin(UUID orderId, OrderStatus status);
}
