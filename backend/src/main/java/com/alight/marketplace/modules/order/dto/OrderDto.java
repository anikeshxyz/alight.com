package com.alight.marketplace.modules.order.dto;

import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private UUID id;
    private String orderNumber;
    private UUID userId;
    private String customerEmail;
    private String customerPhone;
    private String customerName;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private String paymentTransactionId;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal totalAmount;
    private String currency;
    private String customerGstNumber;
    private UUID stockReservationId;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private CheckoutAddressDto shippingAddress;
    private CheckoutAddressDto billingAddress;
    @Builder.Default
    private List<VendorOrderDto> vendorOrders = new ArrayList<>();
    @Builder.Default
    private List<OrderItemDto> items = new ArrayList<>();
}
