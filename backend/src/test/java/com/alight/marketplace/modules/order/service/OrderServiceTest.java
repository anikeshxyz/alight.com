package com.alight.marketplace.modules.order.service;

import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.dto.UpdateFulfillmentRequest;
import com.alight.marketplace.modules.order.dto.VendorOrderDto;
import com.alight.marketplace.modules.order.entity.*;
import com.alight.marketplace.modules.order.repository.OrderAddressRepository;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.order.service.impl.OrderServiceImpl;
import com.alight.marketplace.modules.user.entity.User;
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
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private VendorOrderRepository vendorOrderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderAddressRepository orderAddressRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UUID userId;
    private UUID orderId;
    private UUID vendorId;
    private User user;
    private Order order;
    private Vendor vendor;
    private VendorOrder vendorOrder;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        vendorId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("buyer@example.com")
                .firstName("Test")
                .lastName("Buyer")
                .build();

        vendor = Vendor.builder()
                .id(vendorId)
                .storeName("Precision Tech")
                .build();

        order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-2026-10001")
                .user(user)
                .customerEmail("buyer@example.com")
                .orderStatus(OrderStatus.CONFIRMED)
                .totalSubtotal(BigDecimal.valueOf(1000.00))
                .grandTotal(BigDecimal.valueOf(1180.00))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        vendorOrder = VendorOrder.builder()
                .id(UUID.randomUUID())
                .masterOrder(order)
                .vendor(vendor)
                .subOrderNumber("ORD-2026-10001-V1")
                .fulfillmentStatus(FulfillmentStatus.PENDING)
                .subtotal(BigDecimal.valueOf(1000.00))
                .grandTotal(BigDecimal.valueOf(1180.00))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Should retrieve order by order number")
    void shouldGetOrderByNumber() {
        when(orderRepository.findByOrderNumber("ORD-2026-10001")).thenReturn(Optional.of(order));
        when(orderAddressRepository.findByOrderId(orderId)).thenReturn(Collections.emptyList());
        when(vendorOrderRepository.findByMasterOrderId(orderId)).thenReturn(List.of(vendorOrder));
        when(orderItemRepository.findByVendorOrderId(vendorOrder.getId())).thenReturn(Collections.emptyList());

        OrderDto result = orderService.getOrderByNumber("ORD-2026-10001", userId, false);

        assertThat(result).isNotNull();
        assertThat(result.getOrderNumber()).isEqualTo("ORD-2026-10001");
        assertThat(result.getVendorOrders()).hasSize(1);
    }

    @Test
    @DisplayName("Should update vendor sub-order fulfillment with tracking details")
    void shouldUpdateVendorOrderFulfillment() {
        UpdateFulfillmentRequest request = UpdateFulfillmentRequest.builder()
                .fulfillmentStatus(FulfillmentStatus.SHIPPED)
                .courierPartner("Blue Dart")
                .trackingNumber("BLUEDART-123456")
                .notes("Dispatched from Mumbai hub")
                .build();

        when(vendorRepository.findByUserId(userId)).thenReturn(Optional.of(vendor));
        when(vendorOrderRepository.findById(vendorOrder.getId())).thenReturn(Optional.of(vendorOrder));
        when(vendorOrderRepository.save(any(VendorOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(vendorOrderRepository.findByMasterOrderId(orderId)).thenReturn(List.of(vendorOrder));

        VendorOrderDto result = orderService.updateVendorOrderFulfillment(userId, vendorOrder.getId(), request);

        assertThat(result).isNotNull();
        assertThat(result.getFulfillmentStatus()).isEqualTo(FulfillmentStatus.SHIPPED);
        assertThat(result.getCourierPartner()).isEqualTo("Blue Dart");
        assertThat(result.getTrackingNumber()).isEqualTo("BLUEDART-123456");
        verify(orderRepository, times(1)).save(any(Order.class));
    }
}
