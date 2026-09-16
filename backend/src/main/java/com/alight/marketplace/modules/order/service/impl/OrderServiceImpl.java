package com.alight.marketplace.modules.order.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ForbiddenException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.dto.*;
import com.alight.marketplace.modules.order.entity.*;
import com.alight.marketplace.modules.order.repository.OrderAddressRepository;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderAddressRepository orderAddressRepository;
    private final VendorRepository vendorRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.alight.marketplace.modules.audit.service.AuditLogService auditLogService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.alight.marketplace.modules.settlement.service.SettlementService settlementService;

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrderByNumber(String orderNumber, UUID userId, boolean isAdmin) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with number: " + orderNumber));

        UUID orderUserId = order.getUser() != null ? order.getUser().getId() : null;
        if (!isAdmin && userId != null && orderUserId != null && !userId.equals(orderUserId)) {
            throw new ForbiddenException("Access denied to order: " + orderNumber);
        }

        return mapToOrderDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDto> getCustomerOrders(UUID userId, Pageable pageable) {
        return getCustomerOrders(userId, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDto> getCustomerOrders(UUID userId, OrderStatus status, Pageable pageable) {
        Page<Order> orders;
        if (status != null) {
            orders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedAtDesc(userId, status, pageable);
        } else {
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return orders.map(this::mapToOrderDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorOrderDto> getVendorOrders(UUID vendorUserId, FulfillmentStatus status, Pageable pageable) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        Page<VendorOrder> vendorOrders;
        if (status != null) {
            vendorOrders = vendorOrderRepository.findByVendorIdAndFulfillmentStatusOrderByCreatedAtDesc(vendor.getId(), status, pageable);
        } else {
            vendorOrders = vendorOrderRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable);
        }

        return vendorOrders.map(this::mapToVendorOrderDto);
    }

    @Override
    @Transactional
    public VendorOrderDto updateVendorOrderFulfillment(UUID vendorUserId, UUID vendorOrderId, UpdateFulfillmentRequest request) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor order not found: " + vendorOrderId));

        if (vendorOrder.getVendor() == null || !vendorOrder.getVendor().getId().equals(vendor.getId())) {
            throw new ForbiddenException("You do not have permission to fulfill this vendor sub-order");
        }

        vendorOrder.setFulfillmentStatus(request.getFulfillmentStatus());
        if (request.getCourierPartner() != null && !request.getCourierPartner().isBlank()) {
            vendorOrder.setCourierName(request.getCourierPartner());
        }
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            vendorOrder.setTrackingNumber(request.getTrackingNumber());
        }

        if (request.getFulfillmentStatus() == FulfillmentStatus.SHIPPED && vendorOrder.getShippedAt() == null) {
            vendorOrder.setShippedAt(Instant.now());
        } else if (request.getFulfillmentStatus() == FulfillmentStatus.DELIVERED) {
            if (vendorOrder.getDeliveredAt() == null) {
                vendorOrder.setDeliveredAt(Instant.now());
            }
            if (settlementService != null) {
                try {
                    settlementService.releaseEscrow(vendorOrder.getId());
                } catch (Exception ex) {
                    log.error("Failed to auto-release escrow on sub-order delivery: {}", ex.getMessage());
                }
            }
        }

        vendorOrder.setUpdatedAt(Instant.now());
        VendorOrder saved = vendorOrderRepository.save(vendorOrder);

        if (auditLogService != null) {
            auditLogService.recordEvent("VENDOR_ORDER_FULFILLMENT_UPDATED", "VENDOR_ORDER", vendorOrderId.toString(),
                    "Fulfillment status updated to " + request.getFulfillmentStatus() +
                    (request.getTrackingNumber() != null ? " (AWB: " + request.getTrackingNumber() + ")" : ""));
        }

        Order masterOrder = vendorOrder.getMasterOrder();
        if (masterOrder != null) {
            OrderStatus oldStatus = masterOrder.getOrderStatus();
            List<VendorOrder> allVendorOrders = vendorOrderRepository.findByMasterOrderId(masterOrder.getId());
            boolean allDelivered = allVendorOrders.stream().allMatch(vo -> vo.getFulfillmentStatus() == FulfillmentStatus.DELIVERED);
            boolean allShippedOrDelivered = allVendorOrders.stream().allMatch(vo ->
                    vo.getFulfillmentStatus() == FulfillmentStatus.SHIPPED || vo.getFulfillmentStatus() == FulfillmentStatus.DELIVERED);

            OrderStatus newStatus = null;
            if (allDelivered) {
                newStatus = OrderStatus.DELIVERED;
            } else if (allShippedOrDelivered && oldStatus != OrderStatus.SHIPPED) {
                newStatus = OrderStatus.SHIPPED;
            } else if (oldStatus == OrderStatus.CONFIRMED && request.getFulfillmentStatus() == FulfillmentStatus.PROCESSING) {
                newStatus = OrderStatus.PROCESSING;
            }

            if (newStatus != null && newStatus != oldStatus) {
                masterOrder.setOrderStatus(newStatus);
                orderRepository.save(masterOrder);
                try {
                    eventPublisher.publishEvent(com.alight.marketplace.common.event.OrderStatusUpdatedEvent.builder()
                            .orderId(masterOrder.getId())
                            .orderNumber(masterOrder.getOrderNumber())
                            .oldStatus(oldStatus.name())
                            .newStatus(newStatus.name())
                            .timestamp(Instant.now())
                            .build());
                } catch (Exception e) {
                    log.warn("Error publishing OrderStatusUpdatedEvent: {}", e.getMessage());
                }
            }
        }

        return mapToVendorOrderDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderDto> getAllOrdersAdmin(OrderStatus status, Pageable pageable) {
        Page<Order> orders;
        if (status != null) {
            orders = orderRepository.findByOrderStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return orders.map(this::mapToOrderDto);
    }

    @Override
    @Transactional
    public OrderDto updateOrderStatusAdmin(UUID orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        OrderStatus oldStatus = order.getOrderStatus();
        order.setOrderStatus(status);
        order.setUpdatedAt(Instant.now());
        Order saved = orderRepository.save(order);

        if (status == OrderStatus.DELIVERED) {
            List<VendorOrder> vendorOrders = vendorOrderRepository.findByMasterOrderId(order.getId());
            for (VendorOrder vo : vendorOrders) {
                if (vo.getFulfillmentStatus() != FulfillmentStatus.DELIVERED) {
                    vo.setFulfillmentStatus(FulfillmentStatus.DELIVERED);
                    if (vo.getDeliveredAt() == null) {
                        vo.setDeliveredAt(Instant.now());
                    }
                    vendorOrderRepository.save(vo);
                }
                if (settlementService != null) {
                    try {
                        settlementService.releaseEscrow(vo.getId());
                    } catch (Exception ex) {
                        log.error("Failed to release escrow on master order delivery for {}: {}", vo.getSubOrderNumber(), ex.getMessage());
                    }
                }
            }
        }

        try {
            eventPublisher.publishEvent(com.alight.marketplace.common.event.OrderStatusUpdatedEvent.builder()
                    .orderId(saved.getId())
                    .orderNumber(saved.getOrderNumber())
                    .oldStatus(oldStatus.name())
                    .newStatus(status.name())
                    .timestamp(Instant.now())
                    .build());
        } catch (Exception e) {
            log.warn("Error publishing OrderStatusUpdatedEvent: {}", e.getMessage());
        }

        return mapToOrderDto(saved);
    }

    private OrderDto mapToOrderDto(Order order) {
        List<OrderAddress> addresses = orderAddressRepository.findByOrderId(order.getId());
        CheckoutAddressDto shipping = addresses.stream()
                .filter(a -> a.getAddressType() == AddressType.SHIPPING)
                .findFirst()
                .map(this::mapAddressDto)
                .orElse(null);

        CheckoutAddressDto billing = addresses.stream()
                .filter(a -> a.getAddressType() == AddressType.BILLING)
                .findFirst()
                .map(this::mapAddressDto)
                .orElse(shipping);

        List<VendorOrder> vendorOrders = vendorOrderRepository.findByMasterOrderId(order.getId());
        List<VendorOrderDto> vendorOrderDtos = vendorOrders.stream()
                .map(this::mapToVendorOrderDto)
                .collect(Collectors.toList());

        List<OrderItemDto> allItems = vendorOrderDtos.stream()
                .flatMap(vo -> vo.getItems().stream())
                .collect(Collectors.toList());

        UUID uId = order.getUser() != null ? order.getUser().getId() : null;

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(uId)
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .customerName(order.getCustomerName())
                .status(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .subtotalAmount(order.getTotalSubtotal())
                .discountAmount(order.getTotalDiscount())
                .taxAmount(order.getTotalTax())
                .shippingAmount(order.getTotalShipping())
                .totalAmount(order.getGrandTotal())
                .currency(order.getCurrencyCode())
                .stockReservationId(order.getReservationId())
                .notes(order.getNotes())
                .createdAt(toOffsetDateTime(order.getCreatedAt()))
                .updatedAt(toOffsetDateTime(order.getUpdatedAt()))
                .shippingAddress(shipping)
                .billingAddress(billing)
                .vendorOrders(vendorOrderDtos)
                .items(allItems)
                .build();
    }

    private VendorOrderDto mapToVendorOrderDto(VendorOrder vo) {
        List<OrderItem> items = orderItemRepository.findByVendorOrderId(vo.getId());
        List<OrderItemDto> itemDtos = items.stream()
                .map(this::mapOrderItemDto)
                .collect(Collectors.toList());

        Vendor v = vo.getVendor();
        String storeName = v != null ? v.getStoreName() : "Marketplace Seller";
        String gst = (v != null && v.getBusinessDetails() != null && v.getBusinessDetails().getTaxIdGstin() != null)
                ? v.getBusinessDetails().getTaxIdGstin() : "";
        String state = "Maharashtra";

        return VendorOrderDto.builder()
                .id(vo.getId())
                .orderId(vo.getMasterOrder().getId())
                .orderNumber(vo.getMasterOrder().getOrderNumber())
                .vendorId(v != null ? v.getId() : null)
                .vendorStoreName(storeName)
                .vendorGstNumber(gst)
                .vendorState(state)
                .subOrderNumber(vo.getSubOrderNumber())
                .fulfillmentStatus(vo.getFulfillmentStatus())
                .subtotalAmount(vo.getSubtotal())
                .discountAmount(vo.getDiscountAmount())
                .taxAmount(vo.getTaxAmount())
                .shippingAmount(vo.getShippingAmount())
                .commissionRate(vo.getCommissionRate())
                .commissionAmount(vo.getCommissionAmount())
                .vendorPayoutAmount(vo.getPayoutAmount() != null && vo.getPayoutAmount().compareTo(java.math.BigDecimal.ZERO) > 0 ? vo.getPayoutAmount() : vo.getGrandTotal())
                .notes(vo.getNotes())
                .courierPartner(vo.getCourierName())
                .trackingNumber(vo.getTrackingNumber())
                .shippedAt(toOffsetDateTime(vo.getShippedAt()))
                .deliveredAt(toOffsetDateTime(vo.getDeliveredAt()))
                .createdAt(toOffsetDateTime(vo.getCreatedAt()))
                .items(itemDtos)
                .build();
    }

    private OrderItemDto mapOrderItemDto(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .orderId(item.getVendorOrder() != null && item.getVendorOrder().getMasterOrder() != null ? item.getVendorOrder().getMasterOrder().getId() : null)
                .vendorOrderId(item.getVendorOrder() != null ? item.getVendorOrder().getId() : null)
                .vendorId(item.getVendorOrder() != null && item.getVendorOrder().getVendor() != null ? item.getVendorOrder().getVendor().getId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .productTitle(item.getProductTitle())
                .variantSku(item.getSku())
                .variantName(item.getVariantName())
                .primaryImageUrl(item.getImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotalAmount(item.getSubtotal())
                .taxRate(item.getTaxRate())
                .totalTaxAmount(item.getTaxAmount())
                .totalAmount(item.getGrandTotal())
                .build();
    }

    private CheckoutAddressDto mapAddressDto(OrderAddress addr) {
        return CheckoutAddressDto.builder()
                .id(addr.getId())
                .addressType(addr.getAddressType())
                .fullName(addr.getFullName())
                .phone(addr.getPhone())
                .addressLine1(addr.getAddressLine1())
                .addressLine2(addr.getAddressLine2())
                .city(addr.getCity())
                .state(addr.getState())
                .postalCode(addr.getPostalCode())
                .country(addr.getCountryCode())
                .build();
    }

    private OffsetDateTime toOffsetDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }
}
