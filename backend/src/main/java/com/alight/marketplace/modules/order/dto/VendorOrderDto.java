package com.alight.marketplace.modules.order.dto;

import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
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
public class VendorOrderDto {
    private UUID id;
    private UUID orderId;
    private String orderNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private String vendorGstNumber;
    private String vendorState;
    private String subOrderNumber;
    private FulfillmentStatus fulfillmentStatus;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal vendorPayoutAmount;
    private String courierPartner;
    private String trackingNumber;
    private OffsetDateTime shippedAt;
    private OffsetDateTime deliveredAt;
    private String notes;
    private OffsetDateTime createdAt;
    @Builder.Default
    private List<OrderItemDto> items = new ArrayList<>();
}
